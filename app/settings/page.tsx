"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, patch, post } from "@/lib/api";

export default function Settings() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api("/me").then(setMe).catch(() => router.replace("/login"));
  }, [router]);

  async function setStatus(status: "ACTIVE" | "PAUSED" | "HIDDEN") {
    await patch("/me", { status });
    setMe({ ...me, status });
  }

  async function exportData() {
    const data = await api("/me/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nchufek-my-data.json";
    a.click();
  }

  async function logout() {
    await post("/auth/logout");
    router.replace("/");
  }

  async function deleteAccount() {
    await api("/me", { method: "DELETE" });
    await post("/auth/logout");
    router.replace("/");
  }

  if (!me)
    return (
      <main className="min-h-dvh grid place-items-center">
        <div className="skeleton h-40 w-72" />
      </main>
    );

  return (
    <main className="min-h-dvh px-5 py-10 max-w-lg mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <a
          href="/discover"
          className="text-mist hover:text-white"
          aria-label="Back"
        >
          ←
        </a>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
      </header>

      <section className="glass p-6">
        <h2 className="font-display font-semibold mb-1">Account</h2>
        <p className="text-sm text-mist">
          {me.firstName} · {me.email}
        </p>

        <a
          href="/profile"
          className="btn-ghost block w-full mt-4 text-sm text-center"
        >
          Edit profile
        </a>

        <button onClick={logout} className="btn-ghost w-full mt-2 text-sm">
          Log out
        </button>
      </section>

      <section className="glass p-6 space-y-4">
        <h2 className="font-display font-semibold">Visibility</h2>

        <div className="flex flex-wrap gap-2">
          {(["ACTIVE", "PAUSED", "HIDDEN"] as const).map((s) => (
            <button
              key={s}
              className="chip"
              data-on={me.status === s}
              onClick={() => setStatus(s)}
            >
              {s === "ACTIVE"
                ? "Active"
                : s === "PAUSED"
                ? "Paused"
                : "Hidden"}
            </button>
          ))}
        </div>

        <p className="text-xs text-mist">
          Paused or Hidden: you stop appearing in anyone&apos;s matches.
        </p>
      </section>

      <section className="glass p-6 space-y-3">
        <h2 className="font-display font-semibold">Your data</h2>

        <button onClick={exportData} className="btn-ghost w-full text-sm">
          Download everything we hold about you
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-sm text-danger py-3"
          >
            Delete my account permanently
          </button>
        ) : (
          <div className="border border-danger/40 rounded-card p-4 space-y-3">
            <p className="text-sm">
              This removes your profile, matches, and messages. It cannot be
              undone.
            </p>

            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                className="flex-1 rounded-card bg-danger text-white py-3 text-sm font-medium"
              >
                Yes, delete everything
              </button>

              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost flex-1 text-sm"
              >
                Keep my account
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}