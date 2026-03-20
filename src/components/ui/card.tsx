import { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      {children}
    </section>
  );
}
