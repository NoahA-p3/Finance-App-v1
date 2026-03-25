import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPasswordResetEnabled, normalizeEmail, readJsonObject, resolveAuthRedirectUrl } from "../utils";

export async function POST(req: Request) {
  if (!isPasswordResetEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const payload = await readJsonObject(req);

  if (!payload) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
  const email = normalizeEmail(payload.email);

  if (!email) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resolveAuthRedirectUrl(req, "/reset-password") ?? undefined
  });

  return NextResponse.json({
    message: "If the account exists, a password reset link has been sent."
  });
}
