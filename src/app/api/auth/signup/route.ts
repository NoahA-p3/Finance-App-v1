import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail, readJsonObject, resolveSiteUrl } from "../utils";

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

  const siteUrl = resolveSiteUrl(req.url);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      },
      emailRedirectTo: `${siteUrl}/login?verified=success`
    }
  });

  if (error) {
    return NextResponse.json({ error: "Unable to create account." }, { status: 400 });
  }

  return NextResponse.json(
    {
      user: data.user,
      requiresEmailConfirmation: !data.session,
      message: "If verification is required, check your email for the confirmation link."
    },
    { status: 201 }
  );
}
