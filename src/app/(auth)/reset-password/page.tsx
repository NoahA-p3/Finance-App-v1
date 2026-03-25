import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "../_components/reset-password-form";
import { isPasswordResetEnabled } from "@/lib/auth-flags";

export default function ResetPasswordPage() {
  if (!isPasswordResetEnabled()) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
