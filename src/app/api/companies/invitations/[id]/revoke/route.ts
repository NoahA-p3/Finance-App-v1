import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_: Request, context: RouteContext) {
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

  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "id must be a UUID string." }, { status: 400 });
  }

  const { data: invitation, error } = await authContext.supabase
    .from("company_invitations")
    .select("id, company_id, invited_email, role, status, invited_by, created_at, updated_at, acceptance_token_expires_at")
    .eq("id", id)
    .eq("company_id", membership.companyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found in active company context." }, { status: 404 });
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      {
        error: `Invitation cannot be revoked when status is ${invitation.status}.`,
        status: invitation.status
      },
      { status: 409 }
    );
  }

  const { data: revokedInvitation, error: revokeError } = await authContext.supabase
    .from("company_invitations")
    .update({
      status: "revoked",
      status_updated_at: new Date().toISOString(),
      status_updated_by: authContext.user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", invitation.id)
    .eq("company_id", membership.companyId)
    .select("id, company_id, invited_email, role, status, invited_by, created_at, updated_at, acceptance_token_expires_at")
    .single();

  if (revokeError) {
    return NextResponse.json({ error: revokeError.message }, { status: 400 });
  }

  return NextResponse.json({ invitation: revokedInvitation });
}
