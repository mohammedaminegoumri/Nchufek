import { prisma, requireUser, json } from "@/lib/core";

const ALLOWED = ["bio","favoriteQuote","heightCm","languages","religion","smoking","drinking",
  "occupation","university","education","hobbies","music","movies","personality","traits",
  "mbti","zodiac","children","instagram","photoUrls"];

const MAX_PHOTO_CHARS = 400_000;      // ~300KB per photo after base64
const MAX_TOTAL_CHARS = 2_000_000;    // ~1.5MB total per profile

function validPhoto(u: unknown): u is string {
  if (typeof u !== "string") return false;
  if (u.length > MAX_PHOTO_CHARS) return false;
  return u.startsWith("data:image/jpeg;base64,")
      || u.startsWith("data:image/png;base64,")
      || u.startsWith("data:image/webp;base64,")
      || /^https:\/\/\S+$/.test(u);
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const data = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.includes(k)));

    if ("photoUrls" in data) {
      const photos = data.photoUrls;
      if (!Array.isArray(photos) || photos.length > 6)
        return json({ error: "Maximum 6 photos" }, 422);
      if (!photos.every(validPhoto))
        return json({ error: "One of the photos is too large or not a valid image" }, 422);
      if (photos.reduce((n: number, p: string) => n + p.length, 0) > MAX_TOTAL_CHARS)
        return json({ error: "Photos are too large in total — remove one and try again" }, 422);
    }

    const profile = await prisma.profile.update({ where: { userId: user.id }, data });
    return json(profile);
  } catch (r) { return r as Response; }
}