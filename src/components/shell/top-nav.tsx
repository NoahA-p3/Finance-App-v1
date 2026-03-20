"use client";

import { Input } from "@/components/ui/input";

export function TopNav({ title }: { title: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-[#22254a] px-4 py-3 shadow-[0_16px_50px_rgba(5,8,28,0.45)] lg:px-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-indigo-200/70">Finance App</p>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="flex w-full items-center gap-3 sm:w-auto">
        <Input placeholder="Search transactions, receipts, reports..." className="h-10 min-w-[240px] flex-1 sm:flex-none sm:w-[320px]" />
        <button
          className="h-10 w-10 rounded-xl border border-white/15 bg-white/5 text-lg text-indigo-100 transition hover:bg-white/10"
          aria-label="Notifications"
          type="button"
        >
          🔔
        </button>
        <button className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-indigo-100 transition hover:bg-white/10">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-400 text-xs font-bold text-[#181a35]">A</span>
          <span className="hidden md:inline">Adaline Horton</span>
        </button>
      </div>
    </header>
  );
}
