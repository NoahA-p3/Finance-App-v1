import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail, readJsonObject } from "../utils";

export async function POST(req: Request) {
  const supabase = await createClient();
  const payload = await readJsonObject(req);

  if (!payload) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === "string" ? payload.password : null;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const lower = error.message.toLowerCase();
    const isUnverified = lower.includes("email") && (lower.includes("confirm") || lower.includes("verify"));

    return NextResponse.json(
      {
        error: isUnverified ? "Please verify your email before signing in." : "Invalid email or password."
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ user: data.user });
}
