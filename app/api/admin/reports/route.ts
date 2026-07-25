import { requireAdmin, adminJsonError, prisma, json } from "@/lib/admin";

/** GET /api/admin/reports?status=PENDING&page=1 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = 20;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: status === "ALL" ? {} : { status },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          reporter: { select: { id: true, phone: true, displayName: true } },
          reported: {
            select: {
              id: true,
              phone: true,
              displayName: true,
              status: true,
              reportCount: true,
            },
          },
        },
      }),
      prisma.report.count({ where: status === "ALL" ? {} : { status } }),
    ]);

    return json({ reports, total, page, pageSize });
  } catch (err) {
    return adminJsonError(err);
  }
}
