import { requireAdmin, adminJsonError, prisma, json } from "@/lib/admin";

/** GET /api/admin/users?q=&status=&page=1 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status"); // ACTIVE | SUSPENDED | BANNED | null(=all)
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = 25;

    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { phone: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
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
          phone: true,
          displayName: true,
          status: true,
          isShadowBanned: true,
          isVerified: true,
          reportCount: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return json({ users, total, page, pageSize });
  } catch (err) {
    return adminJsonError(err);
  }
}
