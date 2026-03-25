import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { getCvrLookupAdapter } from "@/lib/cvr/adapter";

const CVR_PATTERN = /^[0-9]{8}$/;

export async function GET(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) {
    return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  }

  const cvr = req.nextUrl.searchParams.get("cvr")?.trim() ?? "";

  if (!CVR_PATTERN.test(cvr)) {
    return NextResponse.json({ error: "cvr query parameter must be an 8-digit CVR number." }, { status: 400 });
  }

  const adapter = getCvrLookupAdapter();
  const result = await adapter.lookupByCvr(cvr);

  return NextResponse.json({
    company_id: membership.companyId,
    lookup: result
  });
}
