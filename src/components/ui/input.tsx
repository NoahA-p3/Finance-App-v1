import { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring ${props.className ?? ""}`}
    />
  );
}
