import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail, readJsonObject, resolveAuthRedirectUrl } from "../utils";

function classifySignupError(message: string) {
  const lower = message.toLowerCase();

  if (
    lower.includes("redirect") ||
    lower.includes("site url") ||
    lower.includes("email_redirect_to") ||
    lower.includes("not allowed")
  ) {
    return {
      status: 500,
      error:
        "Signup failed because the email redirect URL is not configured in Supabase Auth. Set NEXT_PUBLIC_SITE_URL and allow it in Supabase Auth redirect URLs."
    };
  }

  if (
    lower.includes("already") ||
    lower.includes("registered") ||
    lower.includes("already been registered")
  ) {
    return {
      status: 409,
      error: "An account with this email already exists. Please sign in or reset your password."
    };
  }

  return { status: 400, error: "Unable to create account. Please try again." };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const payload = await readJsonObject(req);

  if (!payload) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === "string" ? payload.password : null;
  const firstName = typeof payload.firstName === "string" ? payload.firstName.trim() : "";
  const lastName = typeof payload.lastName === "string" ? payload.lastName.trim() : "";

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json(
      { error: "Email, first name, last name, and password are required." },
      { status: 400 }
    );
  }

  const emailRedirectTo = resolveAuthRedirectUrl(req, "/login?verified=success");
  const signUpOptions = {
    data: {
      first_name: firstName,
      last_name: lastName
    }
  };

  const primaryAttempt = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { ...signUpOptions, emailRedirectTo } : signUpOptions
  });

  let result = primaryAttempt;

  if (primaryAttempt.error) {
    const lower = primaryAttempt.error.message.toLowerCase();
    const shouldRetryWithoutRedirect =
      Boolean(emailRedirectTo) &&
      (lower.includes("redirect") || lower.includes("site url") || lower.includes("email_redirect_to") || lower.includes("not allowed"));

    if (shouldRetryWithoutRedirect) {
      result = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions
      });
    }
  }

  if (result.error) {
    const classified = classifySignupError(result.error.message);
    return NextResponse.json({ error: classified.error }, { status: classified.status });
  }

  return NextResponse.json(
    {
      user: result.data.user,
      requiresEmailConfirmation: !result.data.session,
      message: "If verification is required, check your email for the confirmation link."
    },
    { status: 201 }
  );
}
