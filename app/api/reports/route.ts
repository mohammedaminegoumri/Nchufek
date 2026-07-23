import { z } from "zod";
import { prisma, requireUser, json } from "@/lib/core";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = z.object({
      reportedId: z.string(),
      reason: z.enum(["HARASSMENT","SPAM","FAKE_PROFILE","INAPPROPRIATE_CONTENT","UNDERAGE","OTHER"]),
      details: z.string().max(1000).optional(),
    }).safeParse(await req.json().catch(() => ({})));
    if (!body.success) return json({ error: "Invalid report" }, 422);

    await prisma.report.create({ data: { reporterId: user.id, ...body.data } });
    const recent = await prisma.report.count({
      where: { reportedId: body.data.reportedId, status: "OPEN",
        createdAt: { gt: new Date(Date.now() - 86400_000) } },
    });
    if (recent >= 3) {
      await prisma.user.update({
        where: { id: body.data.reportedId }, data: { status: "SUSPENDED" },
      });
    }
    return json({ ok: true, note: "Report received. Every report is reviewed." }, 201);
  } catch (r) { return r as Response; }
}
