import { ReportStatus, Prisma } from "@prisma/client";
import { requireAdmin, adminJsonError, prisma, json } from "@/lib/admin";

const VALID_STATUSES = Object.values(ReportStatus) as string[];

/** GET /api/admin/reports?status=OPEN&page=1 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "OPEN";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = 20;

    const where: Prisma.ReportWhereInput =
      statusParam === "ALL"
        ? {}
        : VALID_STATUSES.includes(statusParam)
        ? { status: statusParam as ReportStatus }
        : {}; // unknown value -> no filter rather than a Prisma type error

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          reporter: { select: { id: true, email: true, firstName: true } },
          reported: {
            select: {
              id: true,
              email: true,
              firstName: true,
              status: true,
              _count: { select: { reportsAgainst: true } },
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return json({ reports, total, page, pageSize });
  } catch (err) {
    return adminJsonError(err);
  }
}
