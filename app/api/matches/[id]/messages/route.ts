import { z } from "zod";
import { prisma, requireUser, json, encryptMessage, decryptMessage, rateLimit } from "@/lib/core";

async function getOwnMatch(matchId: string, userId: string) {
  return prisma.match.findFirst({
    where: { id: matchId, status: "ACTIVE", OR: [{ userAId: userId }, { userBId: userId }] },
  });
}

/** Polling endpoint. Pass ?after=<ISO date> to fetch only new messages. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const match = await getOwnMatch(params.id, user.id);
    if (!match) return json({ error: "Match not found" }, 404);

    const after = new URL(req.url).searchParams.get("after");
    const messages = await prisma.message.findMany({
      where: { matchId: match.id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    // Mark the other person's messages as seen
    prisma.message.updateMany({
      where: { matchId: match.id, senderId: { not: user.id }, seenAt: null },
      data: { seenAt: new Date() },
    }).catch(() => {});

    const otherId = match.userAId === user.id ? match.userBId : match.userAId;
    const other = await prisma.user.findUnique({ where: { id: otherId }, select: { lastSeenAt: true } });

    return json({
      reveal: match.reveal,
      iRequestedReveal: match.revealRequestedById === user.id,
      otherOnline: other ? Date.now() - other.lastSeenAt.getTime() < 2 * 60_000 : false,
      messages: messages.map((m) => ({
        id: m.id, senderId: m.senderId,
        text: decryptMessage(m.ciphertext, m.iv),
        seenAt: m.seenAt, createdAt: m.createdAt,
      })),
    });
  } catch (r) { return r as Response; }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    if (!rateLimit(`msg:${user.id}`, 60, 60_000)) return json({ error: "Slow down a little" }, 429);

    const match = await getOwnMatch(params.id, user.id);
    if (!match) return json({ error: "Match not found" }, 404);

    const body = z.object({ text: z.string().min(1).max(2000) })
      .safeParse(await req.json().catch(() => ({})));
    if (!body.success) return json({ error: "Message must be 1–2000 characters" }, 422);

    const { ciphertext, iv } = encryptMessage(body.data.text);
    const message = await prisma.message.create({
      data: { matchId: match.id, senderId: user.id, ciphertext, iv },
    });
    await prisma.match.update({ where: { id: match.id }, data: { updatedAt: new Date() } });
    return json({
      id: message.id, senderId: user.id, text: body.data.text,
      createdAt: message.createdAt, seenAt: null,
    }, 201);
  } catch (r) { return r as Response; }
}
