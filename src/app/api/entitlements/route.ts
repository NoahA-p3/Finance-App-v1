import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyEntitlementsState, upsertUsageCounters } from "@/lib/entitlements";
import { isEntitlementReadEnabled } from "@/lib/auth-flags";

export async function GET() {
  if (!isEntitlementReadEnabled()) {
    return NextResponse.json({ error: "Entitlements feature is disabled." }, { status: 404 });
  }

  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = await getCompanyEntitlementsState(authContext.supabase, authContext.user.id);

  if (!state) {
    return NextResponse.json({ error: "No active company subscription found." }, { status: 404 });
  }

  await upsertUsageCounters(authContext.supabase, state);

  return NextResponse.json({
    company_id: state.companyId,
    plan: state.plan,
    entitlements: state.entitlements,
    usage: state.usage
  });
}
