/**
 * NCHUFEK? v2 core — everything the API routes need, serverless-safe.
 * No Redis, no sockets, no external services. $0 by design.
 */
import { PrismaClient, User, Profile, Preference, Habit } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { cookies } from "next/headers";

// ── Prisma singleton (survives serverless hot reloads) ───────────────
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

// ── Auth: JWT in an httpOnly cookie ──────────────────────────────────
const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE = "nch_session";

export async function createSession(userId: string, isAdmin = false) {
  const token = jwt.sign({ sub: userId, isAdmin }, SECRET, { expiresIn: "30d" });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 30 * 24 * 3600,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<{ userId: string; isAdmin: boolean } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const p = jwt.verify(token, SECRET) as { sub: string; isAdmin: boolean };
    return { userId: p.sub, isAdmin: p.isAdmin };
  } catch { return null; }
}

/** Auth guard for route handlers. Throws a Response on failure. */
export async function requireUser() {
  const s = await getSession();
  if (!s) throw new Response(JSON.stringify({ error: "Sign in first" }), { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!user || user.status === "DELETED")
    throw new Response(JSON.stringify({ error: "Account not found" }), { status: 401 });
  if (user.status === "SUSPENDED")
    throw new Response(JSON.stringify({ error: "Account suspended" }), { status: 403 });
  // Cheap presence: touch lastSeenAt at most once a minute
  if (Date.now() - user.lastSeenAt.getTime() > 60_000) {
    prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return user;
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// ── Message encryption at rest (AES-256-GCM) ─────────────────────────
function msgKey(): Buffer {
  const b64 = process.env.MESSAGE_ENCRYPTION_KEY;
  if (b64) return Buffer.from(b64, "base64");
  // dev fallback: derived, deterministic — replace in production
  return crypto.createHash("sha256").update(SECRET).digest();
}

export function encryptMessage(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", msgKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: Buffer.concat([enc, cipher.getAuthTag()]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptMessage(ciphertext: string, iv: string): string {
  try {
    const buf = Buffer.from(ciphertext, "base64");
    const tag = buf.subarray(buf.length - 16);
    const enc = buf.subarray(0, buf.length - 16);
    const d = crypto.createDecipheriv("aes-256-gcm", msgKey(), Buffer.from(iv, "base64"));
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch { return "[unreadable message]"; }
}

// ── Location privacy ─────────────────────────────────────────────────
export function fuzzCoordinates(lat: number, lon: number) {
  return { latitude: Math.round(lat * 100) / 100, longitude: Math.round(lon * 100) / 100 };
}

// ── In-memory rate limiting (per serverless instance — free tier ok) ─
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return true; }
  if (b.n >= max) return false;
  b.n++;
  return true;
}

// ═════════════════════ MATCHING ALGORITHM ════════════════════════════
// Weighted, explainable. Same engine as v1, adapted to the leaner schema.

export const WEIGHTS = {
  age: 20, interests: 15, personality: 15, goals: 15, distance: 10,
  lifestyle: 10, languages: 5, education: 5, religion: 5, activity: 5, randomness: 5,
} as const;
const TOTAL = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

type FullUser = User & { profile: Profile | null; preferences: Preference | null };

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const ageOf = (u: User) => Math.floor((Date.now() - u.birthDate.getTime()) / 3.15576e10);

function sAge(me: FullUser, them: FullUser) {
  const a = ageOf(them);
  const min = me.preferences?.ageMin ?? 18, max = me.preferences?.ageMax ?? 45;
  if (a >= min && a <= max) return Math.max(0.7, 1 - Math.abs(ageOf(me) - a) / 25);
  const over = a < min ? min - a : a - max;
  return Math.max(0, 0.6 - over * 0.15);
}

function sInterests(a: Profile | null, b: Profile | null) {
  if (!a || !b) return 0.4;
  const A = new Set([...a.hobbies, ...a.music, ...a.movies].map((s) => s.toLowerCase()));
  const B = new Set([...b.hobbies, ...b.music, ...b.movies].map((s) => s.toLowerCase()));
  if (!A.size || !B.size) return 0.4;
  const inter = [...A].filter((x) => B.has(x)).length;
  const jac = inter / new Set([...A, ...B]).size;
  const hob = a.hobbies.filter((h) => b.hobbies.includes(h)).length;
  return Math.min(1, jac * 1.6 + hob * 0.08);
}

function sPersonality(a: Profile | null, b: Profile | null) {
  if (!a || !b) return 0.45;
  let s = 0.3;
  if (a.personality && b.personality) {
    if (a.personality === "AMBIVERT" || b.personality === "AMBIVERT") s += 0.2;
    else if (a.personality !== b.personality) s += 0.25;
    else s += 0.15;
  }
  s += Math.min(0.25, a.traits.filter((t) => b.traits.includes(t)).length * 0.07);
  const owlA = a.traits.includes("night_owl"), owlB = b.traits.includes("night_owl");
  const birdA = a.traits.includes("early_bird"), birdB = b.traits.includes("early_bird");
  if ((owlA && birdB) || (birdA && owlB)) s -= 0.1;
  if ((owlA && owlB) || (birdA && birdB)) s += 0.05;
  if (a.mbti?.length === 4 && b.mbti?.length === 4)
    s += [...a.mbti].filter((c, i) => b.mbti![i] === c).length * 0.04;
  return Math.max(0, Math.min(1, s));
}

function sGoals(a: User, b: User) {
  const overlap = a.goals.filter((g) => b.goals.includes(g)).length;
  if (overlap > 0) return Math.min(1, 0.7 + overlap * 0.15);
  const clash = (a.goals.includes("MARRIAGE") && b.goals.includes("SHORT_TERM")) ||
                (b.goals.includes("MARRIAGE") && a.goals.includes("SHORT_TERM"));
  return clash ? 0.05 : 0.3;
}

const sDistance = (d: number, r: number) => (d > r ? 0 : 1 - (d / r) * 0.7);

function sLifestyle(a: FullUser, b: FullUser) {
  let s = 0.5;
  const h = (x?: Habit | null) => x ?? "PREFER_NOT_SAY";
  const pair = (ha: Habit, hb: Habit) => {
    if (ha === "PREFER_NOT_SAY" || hb === "PREFER_NOT_SAY") return 0;
    if (ha === hb) return 0.15;
    if ((ha === "OFTEN" && hb === "NEVER") || (hb === "OFTEN" && ha === "NEVER")) return -0.25;
    return 0.05;
  };
  s += pair(h(a.profile?.smoking), h(b.profile?.smoking));
  s += pair(h(a.profile?.drinking), h(b.profile?.drinking));
  const ca = a.profile?.children, cb = b.profile?.children;
  if (ca && cb && ca !== "PREFER_NOT_SAY" && cb !== "PREFER_NOT_SAY") {
    if (ca === cb) s += 0.15;
    else if ((ca === "WANT" && cb === "DONT_WANT") || (cb === "WANT" && ca === "DONT_WANT")) s -= 0.35;
  }
  return Math.max(0, Math.min(1, s));
}

function sLanguages(a: Profile | null, b: Profile | null) {
  if (!a?.languages.length || !b?.languages.length) return 0.5;
  const shared = a.languages.filter((l) => b.languages.includes(l)).length;
  return shared === 0 ? 0.1 : Math.min(1, 0.6 + shared * 0.15);
}

const EDU = ["HIGH_SCHOOL", "BAC", "LICENCE", "MASTER", "DOCTORATE", "OTHER"];
function sEducation(a: Profile | null, b: Profile | null) {
  if (!a?.education || !b?.education) return 0.5;
  return Math.max(0.3, 1 - Math.abs(EDU.indexOf(a.education) - EDU.indexOf(b.education)) * 0.2);
}

function sReligion(a: Profile | null, b: Profile | null) {
  if (!a?.religion || !b?.religion) return 0.5;
  return a.religion.toLowerCase() === b.religion.toLowerCase() ? 1 : 0.25;
}

function sActivity(them: User) {
  const h = (Date.now() - them.lastSeenAt.getTime()) / 3.6e6;
  return h < 1 ? 1 : h < 24 ? 0.8 : h < 72 ? 0.5 : 0.2;
}

const ELEMENTS: Record<string, string> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};
function sRandom(a: Profile | null, b: Profile | null) {
  let z = 0.5;
  const za = a?.zodiac?.toLowerCase(), zb = b?.zodiac?.toLowerCase();
  if (za && zb && ELEMENTS[za] && ELEMENTS[zb]) z = ELEMENTS[za] === ELEMENTS[zb] ? 0.8 : 0.45;
  return z * 0.4 + Math.random() * 0.6;
}

function passesHardFilters(me: FullUser, them: FullUser, d: number) {
  if (them.status !== "ACTIVE" || ageOf(them) < 18) return false;
  const wants = (u: FullUser, o: FullUser) => u.lookingFor === "ANYONE" || u.lookingFor === o.gender;
  if (!wants(me, them) || !wants(them, me)) return false;
  if (d > Math.min(me.searchRadiusKm, them.searchRadiusKm)) return false;
  const p = me.preferences;
  if (p) {
    const a = ageOf(them);
    if (a < p.ageMin || a > p.ageMax) return false;
  }
  return true;
}

export function computeScore(me: FullUser, them: FullUser, d: number) {
  const radius = Math.min(me.searchRadiusKm, them.searchRadiusKm);
  const breakdown = {
    age: sAge(me, them), interests: sInterests(me.profile, them.profile),
    personality: sPersonality(me.profile, them.profile), goals: sGoals(me, them),
    distance: sDistance(d, radius), lifestyle: sLifestyle(me, them),
    languages: sLanguages(me.profile, them.profile), education: sEducation(me.profile, them.profile),
    religion: sReligion(me.profile, them.profile), activity: sActivity(them),
    randomness: sRandom(me.profile, them.profile),
  };
  const raw = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[])
    .reduce((sum, k) => sum + breakdown[k] * WEIGHTS[k], 0);
  return {
    userId: them.id,
    score: Math.round(Math.min(99, 40 + (raw / TOTAL) * 60)),
    breakdown,
    distanceKm: Math.round(d * 10) / 10,
  };
}

export async function findMatches(userId: string, limit = 10) {
  const me = await prisma.user.findUniqueOrThrow({
    where: { id: userId }, include: { profile: true, preferences: true },
  });
  if (me.latitude == null || me.longitude == null)
    throw new Response(JSON.stringify({ error: "Add your location first" }), { status: 422 });

  const [blocks, existing] = await Promise.all([
    prisma.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
    prisma.match.findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] } }),
  ]);
  const excluded = new Set([userId]);
  blocks.forEach((b) => { excluded.add(b.blockerId); excluded.add(b.blockedId); });
  existing.forEach((m) => { excluded.add(m.userAId); excluded.add(m.userBId); });

  const latD = me.searchRadiusKm / 111;
  const lonD = me.searchRadiusKm / (111 * Math.cos((me.latitude * Math.PI) / 180));
  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [...excluded] }, status: "ACTIVE",
      latitude: { gte: me.latitude - latD, lte: me.latitude + latD },
      longitude: { gte: me.longitude - lonD, lte: me.longitude + lonD },
      ...(me.lookingFor !== "ANYONE" ? { gender: me.lookingFor } : {}),
    },
    include: { profile: true, preferences: true },
    take: 300,
  });

  const scored = candidates
    .filter((t) => t.latitude != null && t.longitude != null)
    .map((t) => ({ t, d: haversineKm(me.latitude!, me.longitude!, t.latitude!, t.longitude!) }))
    .filter(({ t, d }) => passesHardFilters(me, t, d))
    .map(({ t, d }) => computeScore(me, t, d))
    .sort((a, b) => b.score - a.score);

  return scored.filter((s) => s.score >= (me.preferences?.minCompatibility ?? 0)).slice(0, limit);
}