import { prisma, requireUser, json } from "@/lib/core";

/** 403 unless reveal is MUTUAL — consent enforced by the API, not the UI. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const match = await prisma.match.findFirst({
      where: { id: params.id, OR: [{ userAId: user.id }, { userBId: user.id }] },
    });
    if (!match) return json({ error: "Match not found" }, 404);
    if (match.reveal !== "MUTUAL")
      return json({ error: "Identity stays hidden until both of you accept the reveal." }, 403);

    const otherId = match.userAId === user.id ? match.userBId : match.userAId;
    const other = await prisma.user.findUniqueOrThrow({
      where: { id: otherId }, include: { profile: true },
    });
    return json({
      firstName: other.firstName,
      photos: other.profile?.photoUrls ?? [],
      instagram: other.profile?.instagram ?? null,
    });
  } catch (r) { return r as Response; }
}
