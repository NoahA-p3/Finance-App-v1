import Link from "next/link";
import { AuthForm } from "@/components/ui/auth-form";

export default function SignupPage() {
  return (
    <div className="w-full">
      <AuthForm mode="signup" />
      <p className="mt-4 text-center text-sm text-slate-600">
        Already a member? <Link href="/login" className="font-semibold">Sign in</Link>
      </p>
    </div>
  );
}
