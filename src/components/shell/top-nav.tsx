"use client";

import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function TopNav({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 lg:px-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="flex items-center gap-3">
        <Input placeholder="Search transactions..." className="hidden w-72 md:block" />
        <ThemeToggle />
        <button
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Notifications"
          type="button"
        >
          🔔
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-xs font-semibold text-white">
          FA
        </button>
      </div>
    </header>
  );
}
