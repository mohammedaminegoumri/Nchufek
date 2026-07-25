"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  newUsers24h: number;
  newUsers7d: number;
  activeMatches: number;
  revealedMatches: number;
  revealRate: number;
  pendingReports: number;
  suspendedUsers: number;
  shadowBanned: number;
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setStats(d)))
      .catch(() => setError("Failed to load stats"));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Overview</h1>
      <p className="text-white/50 mb-8">Live snapshot of the platform.</p>

      {error && <p className="text-red-400">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Total users" value={stats.totalUsers} />
          <Card label="New (24h)" value={stats.newUsers24h} accent />
          <Card label="New (7d)" value={stats.newUsers7d} />
          <Card label="Active matches" value={stats.activeMatches} />
          <Card label="Reveal rate" value={`${stats.revealRate}%`} accent />
          <Card label="Pending reports" value={stats.pendingReports} warn={stats.pendingReports > 0} />
          <Card label="Suspended users" value={stats.suspendedUsers} />
          <Card label="Shadow-banned" value={stats.shadowBanned} />
        </div>
      )}

      {!stats && !error && <p className="text-white/40">Loading…</p>}
    </div>
  );
}

function Card({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-6">
      <div className="text-white/50 text-sm mb-2">{label}</div>
      <div
        className={
          "text-3xl font-bold " +
          (warn ? "text-amber-400" : accent ? "text-[#C084FC]" : "text-white")
        }
      >
        {value}
      </div>
    </div>
  );
}
