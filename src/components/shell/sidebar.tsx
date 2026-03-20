"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, ReceiptIcon, ReportIcon, SettingsIcon, TransactionsIcon } from "@/components/shell/icon";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/transactions", label: "Transactions", icon: TransactionsIcon },
  { href: "/receipts", label: "Receipts", icon: ReceiptIcon },
  { href: "/reports", label: "Reports", icon: ReportIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white shadow-sm lg:block">
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-500">Finance Assistant</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Command Center</h1>
      </div>
      <nav className="space-y-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
