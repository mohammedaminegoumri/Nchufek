import { prisma, requireUser, json, findMatches, rateLimit } from "@/lib/core";

export async function POST() {
  try {
    const user = await requireUser();
    if (!rateLimit(`find:${user.id}`, 30, 3600_000))
      return json({ error: "Matching limit reached. Try again in an hour." }, 429);

    const results = await findMatches(user.id, 10);
    const users = await prisma.user.findMany({
      where: { id: { in: results.map((r) => r.userId) } },
      include: { profile: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    const cards = results.map((r) => {
      const u = byId.get(r.userId)!;
      return {
        candidateId: r.userId,
        compatibility: r.score,
        distanceKm: r.distanceKm,
        age: Math.floor((Date.now() - u.birthDate.getTime()) / 3.15576e10),
        city: u.city,
        online: Date.now() - u.lastSeenAt.getTime() < 5 * 60_000,
        personality: u.profile?.personality,
        traits: u.profile?.traits ?? [],
        hobbies: (u.profile?.hobbies ?? []).slice(0, 6),
        favoriteQuote: u.profile?.favoriteQuote,
        languages: u.profile?.languages ?? [],
      };
    });
    return json({ matches: cards });
  } catch (r) { return r as Response; }
}
