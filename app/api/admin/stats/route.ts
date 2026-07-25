import { requireAdmin, adminJsonError, prisma, json } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdmin();

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers24h,
      newUsers7d,
      activeMatches,
      revealedMatches,
      pendingReports,
      suspendedUsers,
      shadowBanned,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since24h } } }),
      prisma.user.count({ where: { createdAt: { gte: since7d } } }),
      prisma.match.count({ where: { status: "ACTIVE" } }),
      prisma.match.count({ where: { reveal: "MUTUAL" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { isShadowBanned: true } }),
    ]);

    const revealRate =
      activeMatches > 0 ? Math.round((revealedMatches / activeMatches) * 100) : 0;

    return json({
      totalUsers,
      newUsers24h,
      newUsers7d,
      activeMatches,
      revealedMatches,
      revealRate,
      pendingReports,
      suspendedUsers,
      shadowBanned,
    });
  } catch (err) {
    return adminJsonError(err);
  }
}
