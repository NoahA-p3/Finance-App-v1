import { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-50 outline-none ring-cyan-200/30 transition placeholder:text-indigo-200/50 focus:border-cyan-300 focus:ring ${props.className ?? ""}`}
    />
  );
}
