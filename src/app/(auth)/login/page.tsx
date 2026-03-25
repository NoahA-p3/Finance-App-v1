import Link from "next/link";
import { AuthForm } from "@/components/ui/auth-form";
import { isPasswordResetEnabled } from "@/lib/auth-flags";

interface LoginPageProps {
  searchParams: Promise<{
    signup?: string;
    reset?: string;
    verified?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showSignupSuccess = params.signup === "success";
  const showResetSuccess = params.reset === "success";
  const showVerificationSuccess = params.verified === "success";
  const resetEnabled = isPasswordResetEnabled();

  return (
    <div className="w-full space-y-4">
      {showSignupSuccess && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          Account created. Please verify your email, then sign in.
        </p>
      )}

      {showVerificationSuccess && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          Email verified. You can now sign in.
        </p>
      )}

      {showResetSuccess && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          Password reset complete. Sign in with your new password.
        </p>
      )}

      <AuthForm mode="login" />
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400">
          Create one
        </Link>
      </p>

      {resetEnabled && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Need a new verification email? Use sign up with the same email, then choose resend verification.
        </p>
      )}
    </div>
  );
}
