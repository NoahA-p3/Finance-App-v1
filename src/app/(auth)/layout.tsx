export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_42%),radial-gradient(circle_at_80%_85%,_rgba(16,185,129,0.14),_transparent_40%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.2),_transparent_42%),radial-gradient(circle_at_80%_85%,_rgba(20,184,166,0.2),_transparent_38%)]" />
      <section className="relative z-10 w-full max-w-lg">{children}</section>
    </main>
  );
}
