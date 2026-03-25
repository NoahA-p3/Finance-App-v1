import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "../_components/forgot-password-form";
import { isPasswordResetEnabled } from "@/lib/auth-flags";

export default function ForgotPasswordPage() {
  if (!isPasswordResetEnabled()) {
    notFound();
  }

  return <ForgotPasswordForm />;
}
