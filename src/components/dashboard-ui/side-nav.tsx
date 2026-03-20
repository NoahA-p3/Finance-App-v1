"use client";

/**
 * SideNav renders the left vertical navigation rail for dashboard sections.
 * It uses pathname-aware highlighting so active pages are clearly visible.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Invest", href: "#" },
  { label: "Transactions", href: "/transactions" },
  { label: "Cards", href: "#" },
  { label: "Statistics", href: "#" },
  { label: "Settings", href: "#" }
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-[280px] rounded-3xl bg-[#1E213A] p-6 text-slate-200 shadow-xl lg:min-h-[calc(100vh-4rem)]">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-lg font-black text-slate-900">
          ₿
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Finance App</p>
          <p className="text-sm font-semibold text-slate-100">Control Center</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = item.href !== "#" && pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700/40 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="#"
        className="mt-8 block rounded-xl px-4 py-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-100"
      >
        Logout
      </Link>
    </aside>
  );
}
