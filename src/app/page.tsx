import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-5 px-4">
      <h1 className="text-4xl font-bold">Finance Assistant MVP</h1>
      <p className="text-slate-600">Track transactions, upload receipts, and estimate taxes in one dashboard.</p>
      <div className="flex gap-3">
        <Link className="rounded-lg bg-slate-900 px-4 py-2 text-white" href="/signup">
          Create account
        </Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-2" href="/login">
          Login
        </Link>
      </div>
    </main>
  );
}
