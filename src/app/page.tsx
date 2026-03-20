import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.24),_transparent_38%),radial-gradient(circle_at_85%_80%,_rgba(14,165,233,0.18),_transparent_34%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.24),_transparent_38%),radial-gradient(circle_at_85%_80%,_rgba(45,212,191,0.16),_transparent_32%)]" />

      <section className="relative z-10 max-w-3xl rounded-3xl border border-white/70 bg-white/80 px-6 py-10 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70">
        <p className="mx-auto mb-4 w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
          Finance Assistant SaaS
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">Financial clarity in under 5 seconds.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
          Track revenue, expenses, receipts, and tax estimates from one modern command center built for freelancers.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            href="/signup"
          >
            Create account
          </Link>
          <Link
            className="rounded-xl border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
            href="/login"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
