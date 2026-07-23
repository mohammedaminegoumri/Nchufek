import { z } from "zod";
import { prisma, requireUser, json } from "@/lib/core";

/** POST { action: "request" } or { action: "respond", accept: boolean } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser();
    const match = await prisma.match.findFirst({
      where: { id, OR: [{ userAId: user.id }, { userBId: user.id }] },
    });
    if (!match) return json({ error: "Match not found" }, 404);

    const body = z.object({ action: z.enum(["request", "respond"]), accept: z.boolean().optional() })
      .safeParse(await req.json().catch(() => ({})));
    if (!body.success) return json({ error: "Invalid request" }, 422);

    if (body.data.action === "request") {
      if (match.reveal === "MUTUAL") return json({ reveal: "MUTUAL" });
      const otherId = match.userAId === user.id ? match.userBId : match.userAId;
      const otherRequested =
        (match.reveal === "REQUESTED_BY_A" && match.userAId === otherId) ||
        (match.reveal === "REQUESTED_BY_B" && match.userBId === otherId);
      const newState = otherRequested ? "MUTUAL"
        : match.userAId === user.id ? "REQUESTED_BY_A" : "REQUESTED_BY_B";
      const updated = await prisma.match.update({
        where: { id: match.id },
        data: { reveal: newState, revealRequestedById: user.id },
      });
      return json({ reveal: updated.reveal });
    }

    // respond
    if (match.revealRequestedById === user.id)
      return json({ error: "Waiting on your match to answer" }, 409);
    const updated = await prisma.match.update({
      where: { id: match.id },
      data: { reveal: body.data.accept ? "MUTUAL" : "DECLINED" },
    });
    return json({ reveal: updated.reveal });
  } catch (r) { return r as Response; }
}