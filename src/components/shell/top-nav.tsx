"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { AccountMenu } from "@/components/shell/account-menu";
import { SettingsIcon } from "@/components/shell/icon";

interface TopNavProps {
  title: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  companies: Array<{
    company_id: string;
    name: string;
    role: string;
  }>;
  activeCompanyId: string | null;
}

export function TopNav({ title, user, companies, activeCompanyId }: TopNavProps) {
  const router = useRouter();

  async function handleCompanySwitch(nextCompanyId: string) {
    if (!nextCompanyId || nextCompanyId === activeCompanyId) {
      return;
    }

    const response = await fetch("/api/companies/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: nextCompanyId })
    });

    if (!response.ok) {
      return;
    }

    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-[#22254a] px-4 py-3 shadow-[0_16px_50px_rgba(5,8,28,0.45)] lg:px-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-indigo-200/70">Finance App</p>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="flex w-full items-center gap-3 sm:w-auto">
        {companies.length > 0 ? (
          <select
            className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-indigo-100 outline-none transition focus:border-cyan-300/60"
            value={activeCompanyId ?? companies[0]?.company_id ?? ""}
            onChange={(event) => void handleCompanySwitch(event.target.value)}
            aria-label="Active company"
          >
            {companies.map((company) => (
              <option key={company.company_id} value={company.company_id} className="bg-[#22254a] text-white">
                {company.name} ({company.role})
              </option>
            ))}
          </select>
        ) : null}
        <Input placeholder="Search transactions, receipts, reports..." className="h-10 min-w-[240px] flex-1 sm:flex-none sm:w-[320px]" />
        <button
          className="h-10 w-10 rounded-xl border border-white/15 bg-white/5 text-lg text-indigo-100 transition hover:bg-white/10"
          aria-label="Notifications"
          type="button"
        >
          🔔
        </button>
        <Link
          href="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-indigo-100 transition hover:bg-white/10"
          aria-label="Settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </Link>
        <div className="lg:hidden">
          <AccountMenu userId={user.id} initialName={user.name} initialEmail={user.email} />
        </div>
      </div>
    </header>
  );
}
