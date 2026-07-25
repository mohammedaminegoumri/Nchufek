import { z } from "zod";
import { requireAdmin, adminJsonError, prisma, json } from "@/lib/admin";

const bodySchema = z.object({
  action: z.enum([
    "activate",
    "suspend",
    "ban",
    "shadow_ban",
    "remove_shadow_ban",
    "verify",
  ]),
});

/** PATCH /api/admin/users/:id — moderation actions on a single user. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { action } = bodySchema.parse(await req.json());

    const data: Record<string, any> = {
      activate: { status: "ACTIVE" },
      suspend: { status: "SUSPENDED" },
      ban: { status: "BANNED" },
      shadow_ban: { isShadowBanned: true },
      remove_shadow_ban: { isShadowBanned: false },
      verify: { isVerified: true },
    }[action];

    const user = await prisma.user.update({ where: { id }, data });

    await prisma.auditLog
      .create({
        data: { actorId: admin.id, action: `user:${action}`, targetType: "User", targetId: id },
      })
      .catch(() => {});

    return json({ user });
  } catch (err) {
    return adminJsonError(err);
  }
}
