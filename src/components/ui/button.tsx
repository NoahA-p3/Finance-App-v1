import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const classes: Record<Variant, string> = {
  primary: "bg-cyan-300 text-[#1c1f3e] hover:bg-cyan-200",
  secondary: "bg-white/10 text-indigo-100 hover:bg-white/20",
  ghost: "bg-transparent text-indigo-100/85 hover:bg-white/10"
};

export function Button({ children, className = "", variant = "primary", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${classes[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
