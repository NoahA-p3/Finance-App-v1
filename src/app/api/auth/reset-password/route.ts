import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPasswordResetEnabled, normalizePassword, readJsonObject } from "../utils";

export async function POST(req: Request) {
  if (!isPasswordResetEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const payload = await readJsonObject(req);

  if (!payload) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const password = normalizePassword(payload.password);

  if (!password) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Reset session is invalid or expired." }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return NextResponse.json(
      { error: "Unable to reset password. Please request a new reset link." },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "Password updated successfully." });
}
