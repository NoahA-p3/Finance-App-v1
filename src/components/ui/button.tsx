import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const classes: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400",
  secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-200 dark:hover:bg-indigo-500/30",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
};

export function Button({ children, className = "", variant = "primary", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${classes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
