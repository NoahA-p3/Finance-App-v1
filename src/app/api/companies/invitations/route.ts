import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import {
  ADVANCED_ROLES,
  BASELINE_ROLES,
  COMPANY_PERMISSIONS,
  getCompanyMembershipContext,
  hasCompanyPermission,
  isAdvancedRole,
  isBaselineRole
} from "@/lib/company-permissions";
import { isAdvancedRolesEnabled } from "@/lib/auth-flags";

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.includes("@") ? normalized : null;
}

function isAllowedRole(role: string) {
  if (isBaselineRole(role)) {
    return true;
  }

  return isAdvancedRolesEnabled() && isAdvancedRole(role);
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

  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.INVITATIONS_READ)) {
    return NextResponse.json({ error: "Missing required permission: company.invitations.read" }, { status: 403 });
  }

  const { data: invitations, error } = await authContext.supabase
    .from("company_invitations")
    .select("id, company_id, invited_email, role, status, invited_by, created_at, updated_at")
    .eq("company_id", membership.companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ company_id: membership.companyId, pending_invitations: invitations });
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);

  if (!membership) {
    return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  }

  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.INVITATIONS_MANAGE)) {
    return NextResponse.json({ error: "Missing required permission: company.invitations.manage" }, { status: 403 });
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

  const { invited_email, role } = payload as { invited_email?: unknown; role?: unknown };

  const email = normalizeEmail(invited_email);

  if (!email) {
    return NextResponse.json({ error: "invited_email must be a valid email." }, { status: 400 });
  }

  const roleValue = typeof role === "string" ? role.trim() : "staff";

  if (!isAllowedRole(roleValue)) {
    const allowedRoles = isAdvancedRolesEnabled() ? [...BASELINE_ROLES, ...ADVANCED_ROLES] : [...BASELINE_ROLES];
    return NextResponse.json({ error: `Unsupported role. Allowed roles: ${allowedRoles.join(", ")}.` }, { status: 400 });
  }

  const { data: invitation, error } = await authContext.supabase
    .from("company_invitations")
    .insert({
      company_id: membership.companyId,
      invited_email: email,
      role: roleValue,
      invited_by: authContext.user.id,
      status: "pending"
    })
    .select("id, company_id, invited_email, role, status, invited_by, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ invitation }, { status: 201 });
}
