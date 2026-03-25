import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { readJsonObject } from "@/app/api/auth/utils";

export async function POST(req: Request) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await readJsonObject(req);
  const factorId = typeof payload?.factorId === "string" ? payload.factorId : null;

  if (!factorId) {
    return NextResponse.json({ error: "factorId is required." }, { status: 400 });
  }

  const challenge = await authContext.supabase.auth.mfa.challenge({ factorId });

  if (challenge.error) {
    return NextResponse.json({ error: "Unable to create MFA challenge." }, { status: 400 });
  }

  return NextResponse.json({ challengeId: challenge.data.id });
}
