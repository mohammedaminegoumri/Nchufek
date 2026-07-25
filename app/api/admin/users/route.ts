import { AccountStatus, Prisma } from "@prisma/client";
import { requireAdmin, adminJsonError, prisma, json } from "@/lib/admin";

const VALID_STATUSES = Object.values(AccountStatus) as string[];

/** GET /api/admin/users?q=&status=&page=1 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const statusParam = searchParams.get("status"); // ACTIVE | SUSPENDED | BANNED | ... | null(=all)
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = 25;

    const where: Prisma.UserWhereInput = {};
    if (statusParam && VALID_STATUSES.includes(statusParam)) {
      where.status = statusParam as AccountStatus;
    }
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          status: true,
          isShadowBanned: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { reportsAgainst: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return json({ users, total, page, pageSize });
  } catch (err) {
    return adminJsonError(err);
  }
}
