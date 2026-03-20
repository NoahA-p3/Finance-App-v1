import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const classes: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-700",
  secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
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
