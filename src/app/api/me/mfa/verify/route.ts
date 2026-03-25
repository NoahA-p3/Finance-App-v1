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
  const challengeId = typeof payload?.challengeId === "string" ? payload.challengeId : null;
  const code = typeof payload?.code === "string" ? payload.code.trim() : null;

  if (!factorId || !challengeId || !code) {
    return NextResponse.json({ error: "factorId, challengeId, and code are required." }, { status: 400 });
  }

  const verify = await authContext.supabase.auth.mfa.verify({ factorId, challengeId, code });

  if (verify.error) {
    return NextResponse.json({ error: "Invalid MFA code." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
