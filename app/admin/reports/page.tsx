"use client";

import { useEffect, useState, useCallback } from "react";

type Report = {
  id: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: string;
  reporter: { id: string; phone: string; displayName?: string };
  reported: { id: string; phone: string; displayName?: string; status: string; reportCount: number };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/reports?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => load(), [load]);

  async function act(id: string, action: string) {
    setBusyId(id);
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    load();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Reports</h1>
      <p className="text-white/50 mb-6">Review and act on user reports.</p>

      <div className="flex gap-2 mb-6">
        {["PENDING", "RESOLVED", "DISMISSED", "ALL"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={
              "px-4 py-2 rounded-full text-sm border transition-colors " +
              (filter === s
                ? "bg-gradient-to-r from-[#632673] to-[#84319B] border-transparent"
                : "border-white/15 text-white/60 hover:text-white")
            }
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading && <p className="text-white/40">Loading…</p>}
      {!loading && reports.length === 0 && (
        <p className="text-white/40">No reports here. Nice and quiet.</p>
      )}

      <div className="flex flex-col gap-3">
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold">
                  {r.reported.displayName || r.reported.phone}{" "}
                  <span className="text-white/40 text-sm font-normal">
                    ({r.reported.reportCount} reports total · status: {r.reported.status})
                  </span>
                </div>
                <div className="text-white/50 text-sm mt-1">
                  Reported by {r.reporter.displayName || r.reporter.phone} ·{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full border border-white/15 text-white/60">
                {r.status}
              </span>
            </div>

            <div className="text-sm mb-4">
              <span className="text-[#C99BDD]">{r.reason}</span>
              {r.details && <p className="text-white/60 mt-1">{r.details}</p>}
            </div>

            {r.status === "PENDING" && (
              <div className="flex gap-2 flex-wrap">
                <ActionBtn busy={busyId === r.id} onClick={() => act(r.id, "dismiss")}>
                  Dismiss
                </ActionBtn>
                <ActionBtn busy={busyId === r.id} onClick={() => act(r.id, "resolve")}>
                  Resolve (no action)
                </ActionBtn>
                <ActionBtn
                  busy={busyId === r.id}
                  onClick={() => act(r.id, "resolve_and_suspend")}
                  warn
                >
                  Resolve + Suspend user
                </ActionBtn>
                <ActionBtn
                  busy={busyId === r.id}
                  onClick={() => act(r.id, "resolve_and_ban")}
                  danger
                >
                  Resolve + Ban user
                </ActionBtn>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBtn({
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
        "px-4 py-2 rounded-xl text-sm border transition-colors disabled:opacity-40 " +
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
