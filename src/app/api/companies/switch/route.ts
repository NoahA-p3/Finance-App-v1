import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const { company_id } = payload as { company_id?: unknown };

  if (typeof company_id !== "string" || !UUID_PATTERN.test(company_id)) {
    return NextResponse.json({ error: "company_id must be a UUID string." }, { status: 400 });
  }

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id, company_id);

  if (!membership) {
    return NextResponse.json({ error: "No active membership for requested company." }, { status: 403 });
  }

  const { error: profileError } = await authContext.supabase
    .from("profiles")
    .update({ active_company_id: membership.companyId })
    .eq("id", authContext.user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({
    active_company: {
      company_id: membership.companyId,
      company_name: membership.companyName,
      role: membership.role
    }
  });
}
