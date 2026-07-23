/** Minimal fetch wrapper — auth rides in an httpOnly cookie, nothing to manage. */
export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(`/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error ?? "Request failed"), { status: r.status });
  return data;
}
export const post = <T = any>(p: string, b?: unknown) => api<T>(p, { method: "POST", body: JSON.stringify(b ?? {}) });
export const patch = <T = any>(p: string, b?: unknown) => api<T>(p, { method: "PATCH", body: JSON.stringify(b ?? {}) });
export const put = <T = any>(p: string, b?: unknown) => api<T>(p, { method: "PUT", body: JSON.stringify(b ?? {}) });
