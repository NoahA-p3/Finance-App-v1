import { Input } from "@/components/ui/input";

export function TopNav({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="flex items-center gap-3">
        <Input placeholder="Search transactions..." className="hidden w-72 md:block" />
        <button className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
          🔔
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">FA</button>
      </div>
    </header>
  );
}
