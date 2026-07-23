import { prisma, requireUser, json } from "@/lib/core";

export async function GET() {
  try {
    const user = await requireUser();
    const full = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }, include: { profile: true, preferences: true },
    });
    const { passwordHash, ...safe } = full;
    return json(safe);
  } catch (r) { return r as Response; }
}

/** Permanent deletion: anonymize now. */
export async function DELETE() {
  try {
    const user = await requireUser();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "DELETED", deletedAt: new Date(),
        email: `deleted-${user.id}@nchufek.local`, firstName: "Deleted",
        latitude: null, longitude: null,
      },
    });
    return json({ ok: true, note: "Account deleted." });
  } catch (r) { return r as Response; }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    if (!["ACTIVE", "PAUSED", "HIDDEN"].includes(body.status))
      return json({ error: "Invalid status" }, 422);
    await prisma.user.update({ where: { id: user.id }, data: { status: body.status } });
    return json({ ok: true });
  } catch (r) { return r as Response; }
}
