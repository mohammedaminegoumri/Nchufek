import { destroySession, json } from "@/lib/core";
export async function POST() { destroySession(); return json({ ok: true }); }
