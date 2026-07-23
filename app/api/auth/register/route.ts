import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma, createSession, json, rateLimit } from "@/lib/core";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2).max(30),
  birthDate: z.coerce.date().refine(
    (d) => (Date.now() - d.getTime()) / 3.15576e10 >= 18, "You must be 18 or older"),
  gender: z.enum(["MALE", "FEMALE"]),
  lookingFor: z.enum(["MALE", "FEMALE", "ANYONE"]),
  goals: z.array(z.enum(["FRIENDSHIP","DATING","LONG_TERM","SHORT_TERM","MARRIAGE"])).min(1),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`reg:${ip}`, 10, 3600_000)) return json({ error: "Too many attempts" }, 429);

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success)
    return json({ error: body.error.issues[0]?.message ?? "Invalid input" }, 422);

  const { email, password, ...data } = body.data;
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return json({ error: "An account with this email already exists" }, 409);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      ...data,
      profile: { create: {} },
      preferences: { create: {} },
    },
  });
  createSession(user.id, user.isAdmin);
  return json({ ok: true, userId: user.id }, 201);
}
