import { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return <section className="rounded-2xl border border-white/10 bg-[#22254a] p-5 shadow-[0_16px_60px_rgba(5,8,28,0.35)]">{children}</section>;
}
