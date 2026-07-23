import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma, createSession, json, rateLimit } from "@/lib/core";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, 20, 3600_000)) return json({ error: "Too many attempts" }, 429);

  const body = z.object({ email: z.string().email(), password: z.string() })
    .safeParse(await req.json().catch(() => ({})));
  if (!body.success) return json({ error: "Enter your email and password" }, 422);

  const user = await prisma.user.findUnique({ where: { email: body.data.email.toLowerCase() } });
  if (!user || user.status === "DELETED" ||
      !(await bcrypt.compare(body.data.password, user.passwordHash)))
    return json({ error: "Email or password is incorrect" }, 401);
  if (user.status === "SUSPENDED") return json({ error: "Account suspended" }, 403);

  await createSession(user.id, user.isAdmin);
  const onboarded = user.latitude != null;
  return json({ ok: true, onboarded });
}