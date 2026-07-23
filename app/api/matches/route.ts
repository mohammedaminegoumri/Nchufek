import { z } from "zod";
import { prisma, requireUser, json, computeScore, haversineKm } from "@/lib/core";

export async function GET() {
  try {
    const user = await requireUser();
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }], status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, senderId: true, seenAt: true } } },
    });
    return json({
      matches: matches.map((m) => ({
        id: m.id, score: m.score, reveal: m.reveal,
        iRequestedReveal: m.revealRequestedById === user.id,
        lastActivity: m.messages[0]?.createdAt ?? m.createdAt,
        unread: m.messages[0] && m.messages[0].senderId !== user.id && !m.messages[0].seenAt,
      })),
    });
  } catch (r) { return r as Response; }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = z.object({ candidateId: z.string() }).safeParse(await req.json().catch(() => ({})));
    if (!body.success) return json({ error: "Invalid request" }, 422);

    const [aId, bId] = [user.id, body.data.candidateId].sort();
    const [me, them] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: aId }, include: { profile: true, preferences: true } }),
      prisma.user.findUniqueOrThrow({ where: { id: bId }, include: { profile: true, preferences: true } }),
    ]);
    const d = haversineKm(me.latitude!, me.longitude!, them.latitude!, them.longitude!);
    const s = computeScore(me, them, d);
    const match = await prisma.match.upsert({
      where: { userAId_userBId: { userAId: aId, userBId: bId } },
      create: { userAId: aId, userBId: bId, score: s.score, scoreBreakdown: s.breakdown },
      update: { status: "ACTIVE" },
    });
    return json({ match }, 201);
  } catch (r) { return r as Response; }
}
