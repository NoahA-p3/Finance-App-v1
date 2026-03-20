import Link from "next/link";
import { AuthForm } from "@/components/ui/auth-form";

interface LoginPageProps {
  searchParams: Promise<{ signup?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showSignupSuccess = params.signup === "success";

  return (
    <div className="w-full">
      {showSignupSuccess && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Account created. Please verify your email, then sign in.
        </p>
      )}
      <AuthForm mode="login" />
      <p className="mt-4 text-center text-sm text-slate-600">
        No account?{" "}
        <Link href="/signup" className="font-semibold">
          Create one
        </Link>
      </p>
    </div>
  );
}
