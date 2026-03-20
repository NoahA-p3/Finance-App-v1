import Link from "next/link";
import { AuthForm } from "@/components/ui/auth-form";

export default function SignupPage() {
  return (
    <div className="w-full space-y-4">
      <AuthForm mode="signup" />
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
