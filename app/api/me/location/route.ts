import { z } from "zod";
import { prisma, requireUser, json, fuzzCoordinates } from "@/lib/core";

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      city: z.string().max(60).optional(),
      searchRadiusKm: z.number().int().min(5).max(100).optional(),
    }).safeParse(await req.json().catch(() => ({})));
    if (!body.success) return json({ error: "Invalid location" }, 422);

    const { latitude, longitude, city, searchRadiusKm } = body.data;
    const fuzzed = fuzzCoordinates(latitude, longitude);
    await prisma.user.update({
      where: { id: user.id },
      data: { ...fuzzed, city, ...(searchRadiusKm ? { searchRadiusKm } : {}) },
    });
    return json({ ok: true, note: "Coordinates rounded to ~1km for privacy." });
  } catch (r) { return r as Response; }
}
