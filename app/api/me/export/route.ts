import { prisma, requireUser, json, decryptMessage } from "@/lib/core";

export async function GET() {
  try {
    const user = await requireUser();
    const [full, matches, messages] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id }, include: { profile: true, preferences: true } }),
      prisma.match.findMany({ where: { OR: [{ userAId: user.id }, { userBId: user.id }] } }),
      prisma.message.findMany({ where: { senderId: user.id } }),
    ]);
    const { passwordHash, ...safe } = full!;
    return json({
      exportedAt: new Date(), user: safe, matches,
      messages: messages.map((m) => ({
        matchId: m.matchId, sentAt: m.createdAt, text: decryptMessage(m.ciphertext, m.iv),
      })),
    });
  } catch (r) { return r as Response; }
}
