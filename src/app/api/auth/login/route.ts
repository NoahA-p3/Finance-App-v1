import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { identifier, password } = await req.json();

  if (!identifier || !password) {
    return NextResponse.json({ error: "Email or username and password are required." }, { status: 400 });
  }

  let email = identifier;

  if (!identifier.includes("@")) {
    const { data: resolvedEmail, error: lookupError } = await supabase.rpc("email_for_login_identifier", {
      login_identifier: identifier
    });

    if (lookupError) {
      return NextResponse.json({ error: "Unable to log in with that username." }, { status: 400 });
    }

    if (!resolvedEmail) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    email = resolvedEmail;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ user: data.user });
}
