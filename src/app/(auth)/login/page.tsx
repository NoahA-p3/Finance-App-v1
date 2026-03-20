import Link from "next/link";
import { AuthForm } from "@/components/ui/auth-form";

export default function LoginPage() {
  return (
    <div className="w-full">
      <AuthForm mode="login" />
      <p className="mt-4 text-center text-sm text-slate-600">
        No account? <Link href="/signup" className="font-semibold">Create one</Link>
      </p>
    </div>
  );
}
