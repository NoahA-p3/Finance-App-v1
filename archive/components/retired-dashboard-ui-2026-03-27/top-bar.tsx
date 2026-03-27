/**
 * TopBar displays the dashboard greeting, date, search field, and profile actions.
 * This creates the top navigation context for the main dashboard content area.
 */
interface TopBarProps {
  name: string;
}

export default function TopBar({ name }: TopBarProps) {
  const displayDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());

  return (
    <header className="flex flex-col gap-4 rounded-3xl bg-[#272B4A] p-5 text-slate-100 shadow-lg md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xl font-semibold">Hi, {name}, Welcome back!</p>
        <p className="text-sm text-slate-300">Keep your finances on track today.</p>
      </div>

      <p className="text-sm font-medium text-slate-300 md:text-base">{displayDate}</p>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search transactions, cards, goals..."
          className="w-full rounded-xl border border-slate-500/40 bg-slate-800/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none md:w-72"
        />
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-xl bg-slate-700/80 px-3 py-2 text-lg text-slate-100 transition hover:bg-slate-600"
        >
          🔔
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 text-sm font-bold text-white">
          UA
        </div>
      </div>
    </header>
  );
}
