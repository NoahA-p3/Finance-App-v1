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

const footerNav = { href: "/settings", label: "Settings", icon: SettingsIcon };

function NavLink({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: typeof DashboardIcon; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        isActive ? "bg-cyan-300/20 text-cyan-100" : "text-indigo-100/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className={`h-4 w-4 ${isActive ? "text-cyan-300" : "text-indigo-200/80 group-hover:text-white"}`} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[250px] shrink-0 rounded-[22px] border border-white/10 bg-[#22254a] p-4 shadow-[0_24px_80px_rgba(5,8,28,0.55)] lg:flex lg:flex-col">
      <div className="px-2 pb-5 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">FINCHECK</p>
        <p className="mt-1 text-xs text-indigo-100/65">Finance command center</p>
      </div>

      <nav className="space-y-1.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={pathname === item.href} />
        ))}
      </nav>

      <div className="mt-auto space-y-1.5 border-t border-white/10 pt-4">
        <NavLink {...footerNav} isActive={pathname === footerNav.href} />
      </div>
    </aside>
  );
}
