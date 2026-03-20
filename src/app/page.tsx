import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">Finance Assistant SaaS</p>
      <h1 className="text-4xl font-bold">Financial clarity in under 5 seconds.</h1>
      <p className="max-w-2xl text-slate-600">Track revenue, expenses, receipts, and tax estimates from one clean command center built for freelancers.</p>
      <div className="flex gap-3">
        <Link className="rounded-lg bg-slate-900 px-4 py-2 text-white" href="/signup">Create account</Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-2" href="/login">Login</Link>
      </div>
    </main>
  );
}
