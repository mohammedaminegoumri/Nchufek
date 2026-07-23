import { prisma, requireUser, json } from "@/lib/core";

const ALLOWED = ["bio","favoriteQuote","heightCm","languages","religion","smoking","drinking",
  "occupation","university","education","hobbies","music","movies","personality","traits",
  "mbti","zodiac","children","instagram","photoUrls"];

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const data = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.includes(k)));
    if ("photoUrls" in data && Array.isArray(data.photoUrls) && data.photoUrls.length > 6)
      return json({ error: "Maximum 6 photos" }, 422);
    const profile = await prisma.profile.update({ where: { userId: user.id }, data });
    return json(profile);
  } catch (r) { return r as Response; }
}
