import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/core";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser().catch(() => null);
  if (!user || !("isAdmin" in user) || !(user as any).isAdmin) {
    redirect("/"); // not an admin — bounce to the main app
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0a0510] p-6 flex flex-col gap-1">
        <div className="mb-8 flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full"
            style={{
              background:
                "conic-gradient(from 210deg,#210D26,#421A4C,#632673,#84319B,#C084FC,#421A4C,#210D26)",
              boxShadow: "0 0 24px rgba(132,49,155,.6)",
            }}
          />
          <span className="font-bold tracking-wide">
            NCHUFEK<span className="text-[#C084FC]">?</span>{" "}
            <span className="text-white/40 font-normal text-sm">admin</span>
          </span>
        </div>

        <NavLink href="/admin" label="Overview" />
        <NavLink href="/admin/reports" label="Reports" />
        <NavLink href="/admin/users" label="Users" />
      </aside>

      <main className="flex-1 p-8 bg-[radial-gradient(circle_at_top_right,rgba(66,26,76,.25),transparent_50%)]">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
    >
      {label}
    </Link>
  );
}
