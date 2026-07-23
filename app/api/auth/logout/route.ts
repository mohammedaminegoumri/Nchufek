import { destroySession, json } from "@/lib/core";
export async function POST() { await destroySession(); return json({ ok: true }); }