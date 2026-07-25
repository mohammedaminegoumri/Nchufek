import { z } from "zod";
import { requireAdmin, adminJsonError, prisma, json } from "@/lib/admin";

const bodySchema = z.object({
  action: z.enum(["dismiss", "resolve", "resolve_and_suspend", "resolve_and_ban"]),
});

/** PATCH /api/admin/reports/:id  — resolve or dismiss a report, optionally
 *  acting on the reported user in the same step. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { action } = bodySchema.parse(await req.json());

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return json({ error: "Report not found" }, 404);

    const newStatus = action === "dismiss" ? "DISMISSED" : "RESOLVED";

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data: { status: newStatus, resolvedById: admin.id, resolvedAt: new Date() },
      });

      if (action === "resolve_and_suspend") {
        await tx.user.update({
          where: { id: report.reportedId },
          data: { status: "SUSPENDED" },
        });
      }
      if (action === "resolve_and_ban") {
        await tx.user.update({
          where: { id: report.reportedId },
          data: { status: "BANNED" },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: `report:${action}`,
          targetType: "Report",
          targetId: id,
        },
      }).catch(() => {}); // no-op if you don't have an AuditLog model wired yet

      return updated;
    });

    return json({ report: result });
  } catch (err) {
    return adminJsonError(err);
  }
}
