import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const factorResult = await authContext.supabase.auth.mfa.listFactors();

  if (factorResult.error) {
    return NextResponse.json({ error: "Unable to load MFA status." }, { status: 502 });
  }

  return NextResponse.json({
    mfaEnabled: factorResult.data.all.length > 0,
    factors: factorResult.data.all.map((factor) => ({
      id: factor.id,
      factorType: factor.factor_type,
      status: factor.status,
      createdAt: factor.created_at,
      friendlyName: factor.friendly_name
    }))
  });
}
