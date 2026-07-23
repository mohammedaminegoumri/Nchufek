import { z } from "zod";
import { prisma, requireUser, json } from "@/lib/core";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = z.object({ blockedId: z.string() }).safeParse(await req.json().catch(() => ({})));
    if (!body.success) return json({ error: "Invalid request" }, 422);

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: body.data.blockedId } },
      create: { blockerId: user.id, blockedId: body.data.blockedId },
      update: {},
    });
    await prisma.match.updateMany({
      where: { OR: [
        { userAId: user.id, userBId: body.data.blockedId },
        { userAId: body.data.blockedId, userBId: user.id },
      ]},
      data: { status: "UNMATCHED" },
    });
    return json({ ok: true }, 201);
  } catch (r) { return r as Response; }
}
