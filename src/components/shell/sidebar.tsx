"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, ReceiptIcon, ReportIcon, SettingsIcon, TransactionsIcon } from "@/components/shell/icon";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/transactions", label: "Transactions", icon: TransactionsIcon },
  { href: "/receipts", label: "Receipts", icon: ReceiptIcon },
  { href: "/reports", label: "Reports", icon: ReportIcon }
];

const settingsNav = { href: "/settings", label: "Settings", icon: SettingsIcon };

function NavLink({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: typeof DashboardIcon; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        isActive
          ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 lg:flex lg:flex-col">
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">Finance Assistant</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Command Center</h1>
      </div>
      <nav className="space-y-1 px-3">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={pathname === item.href} />
        ))}
      </nav>
      <nav className="mt-auto space-y-1 px-3 pb-4">
        <NavLink {...settingsNav} isActive={pathname === settingsNav.href} />
      </nav>
    </aside>
  );
}
