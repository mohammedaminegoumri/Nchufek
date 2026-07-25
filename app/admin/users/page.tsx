"use client";

import { useEffect, useState, useCallback } from "react";

type User = {
  id: string;
  email: string;
  firstName?: string;
  status: string;
  isShadowBanned: boolean;
  isVerified: boolean;
  createdAt: string;
  _count: { reportsAgainst: number };
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  async function act(id: string, action: string) {
    setBusyId(id);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    load();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Users</h1>
      <p className="text-white/50 mb-6">Search, verify, suspend, or ban.</p>

      <div className="flex gap-3 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or first name…"
          className="flex-1 rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#84319B]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      {loading && <p className="text-white/40">Loading…</p>}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-white/50 text-left">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reports</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.firstName || "—"}</div>
                  <div className="text-white/40 text-xs">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={u.status} shadow={u.isShadowBanned} />
                </td>
                <td className="px-4 py-3">{u._count.reportsAgainst}</td>
                <td className="px-4 py-3 text-white/50">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {!u.isVerified && (
                      <MiniBtn busy={busyId === u.id} onClick={() => act(u.id, "verify")}>
                        Verify
                      </MiniBtn>
                    )}
                    {u.status !== "ACTIVE" && (
                      <MiniBtn busy={busyId === u.id} onClick={() => act(u.id, "activate")}>
                        Reactivate
                      </MiniBtn>
                    )}
                    {u.status === "ACTIVE" && (
                      <MiniBtn busy={busyId === u.id} onClick={() => act(u.id, "suspend")} warn>
                        Suspend
                      </MiniBtn>
                    )}
                    {u.status !== "BANNED" && (
                      <MiniBtn busy={busyId === u.id} onClick={() => act(u.id, "ban")} danger>
                        Ban
                      </MiniBtn>
                    )}
                    <MiniBtn
                      busy={busyId === u.id}
                      onClick={() => act(u.id, u.isShadowBanned ? "remove_shadow_ban" : "shadow_ban")}
                    >
                      {u.isShadowBanned ? "Un-shadowban" : "Shadowban"}
                    </MiniBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status, shadow }: { status: string; shadow: boolean }) {
  const color =
    status === "ACTIVE"
      ? "text-emerald-400 border-emerald-500/30"
      : status === "SUSPENDED"
      ? "text-amber-400 border-amber-500/30"
      : "text-red-400 border-red-500/30";
  return (
    <span className="inline-flex gap-1.5 items-center">
      <span className={`text-xs px-2.5 py-1 rounded-full border ${color}`}>{status}</span>
      {shadow && (
        <span className="text-xs px-2.5 py-1 rounded-full border border-white/15 text-white/50">
          shadow
        </span>
      )}
    </span>
  );
}

function MiniBtn({
  children,
  onClick,
  busy,
  warn,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  warn?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={
        "px-3 py-1.5 rounded-lg text-xs border transition-colors disabled:opacity-40 " +
        (danger
          ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
          : warn
          ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
          : "border-white/15 text-white/70 hover:bg-white/5")
      }
    >
      {busy ? "…" : children}
    </button>
  );
}
