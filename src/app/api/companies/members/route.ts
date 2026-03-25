import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import {
  BASELINE_ROLES,
  COMPANY_PERMISSIONS,
  getCompanyMembershipContext,
  hasCompanyPermission,
  isAdvancedRole,
  isBaselineRole
} from "@/lib/company-permissions";
import { isAdvancedRolesEnabled } from "@/lib/auth-flags";

function isAllowedAssignableRole(role: string) {
  if (isBaselineRole(role)) {
    return true;
  }

  if (!isAdvancedRolesEnabled()) {
    return false;
  }

  return isAdvancedRole(role);
}

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);

  if (!membership) {
    return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  }

  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.MEMBERS_READ)) {
    return NextResponse.json({ error: "Missing required permission: company.members.read" }, { status: 403 });
  }

  const { data: members, error } = await authContext.supabase
    .from("company_memberships")
    .select("id, company_id, user_id, role, created_at")
    .eq("company_id", membership.companyId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ company_id: membership.companyId, members });
}

export async function PATCH(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actingMembership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);

  if (!actingMembership) {
    return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  }

  if (!hasCompanyPermission(actingMembership, COMPANY_PERMISSIONS.MEMBERS_MANAGE)) {
    return NextResponse.json({ error: "Missing required permission: company.members.manage" }, { status: 403 });
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

  const { membership_id, role } = payload as { membership_id?: unknown; role?: unknown };

  if (typeof membership_id !== "string" || membership_id.trim().length === 0) {
    return NextResponse.json({ error: "membership_id is required." }, { status: 400 });
  }

  if (typeof role !== "string" || role.trim().length === 0) {
    return NextResponse.json({ error: "role is required." }, { status: 400 });
  }

  const normalizedRole = role.trim();

  if (!isAllowedAssignableRole(normalizedRole)) {
    const allowedRoles = isAdvancedRolesEnabled() ? [...BASELINE_ROLES, "accountant", "auditor", "payroll_only", "sales_only", "integration_admin"] : [...BASELINE_ROLES];
    return NextResponse.json(
      {
        error: `Unsupported role. Allowed roles: ${allowedRoles.join(", ")}.`
      },
      { status: 400 }
    );
  }

  const { data: targetMembership, error: targetMembershipError } = await authContext.supabase
    .from("company_memberships")
    .select("id, company_id, user_id, role")
    .eq("id", membership_id)
    .single();

  if (targetMembershipError) {
    return NextResponse.json({ error: targetMembershipError.message }, { status: 400 });
  }

  if (targetMembership.company_id !== actingMembership.companyId) {
    return NextResponse.json({ error: "Cannot update membership outside your company." }, { status: 403 });
  }

  if (targetMembership.user_id === authContext.user.id && normalizedRole !== "owner") {
    const { count: ownerCount, error: ownerCountError } = await authContext.supabase
      .from("company_memberships")
      .select("id", { count: "exact", head: true })
      .eq("company_id", actingMembership.companyId)
      .eq("role", "owner");

    if (ownerCountError) {
      return NextResponse.json({ error: ownerCountError.message }, { status: 400 });
    }

    if ((ownerCount ?? 0) <= 1) {
      return NextResponse.json({ error: "At least one owner must remain in the company." }, { status: 400 });
    }
  }

  const { data: updatedMembership, error: updateError } = await authContext.supabase
    .from("company_memberships")
    .update({ role: normalizedRole })
    .eq("id", targetMembership.id)
    .select("id, company_id, user_id, role, created_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ membership: updatedMembership });
}
