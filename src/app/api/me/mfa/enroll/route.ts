import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { readJsonObject } from "@/app/api/auth/utils";

export async function POST(req: Request) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await readJsonObject(req);
  const friendlyName = typeof payload?.friendlyName === "string" ? payload.friendlyName.trim() : "Authenticator";

  const enrollment = await authContext.supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: friendlyName || "Authenticator"
  });

  if (enrollment.error) {
    return NextResponse.json({ error: "Unable to start MFA enrollment." }, { status: 400 });
  }

  return NextResponse.json({
    factorId: enrollment.data.id,
    uri: enrollment.data.totp.uri,
    qrCode: enrollment.data.totp.qr_code
  });
}
