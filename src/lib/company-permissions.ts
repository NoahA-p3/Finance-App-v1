import { createClient } from "@/lib/supabase/server";

export const COMPANY_PERMISSIONS = {
  SETTINGS_MANAGE: "company.settings.manage",
  MEMBERS_READ: "company.members.read",
  MEMBERS_MANAGE: "company.members.manage",
  INVITATIONS_READ: "company.invitations.read",
  INVITATIONS_MANAGE: "company.invitations.manage"
} as const;

export type CompanyPermissionKey = (typeof COMPANY_PERMISSIONS)[keyof typeof COMPANY_PERMISSIONS];

export interface CompanyMembershipContext {
  companyId: string;
  role: string;
  permissions: Set<string>;
}

export async function getCompanyMembershipContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId?: string
): Promise<CompanyMembershipContext | null> {
  let membershipQuery = supabase
    .from("company_memberships")
    .select("company_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (companyId) {
    membershipQuery = membershipQuery.eq("company_id", companyId);
  }

  const { data: membership, error: membershipError } = await membershipQuery.maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const { data: rolePermissions, error: rolePermissionsError } = await supabase
    .from("role_permissions")
    .select("permission_key")
    .eq("role_key", membership.role);

  if (rolePermissionsError) {
    return null;
  }

  return {
    companyId: membership.company_id,
    role: membership.role,
    permissions: new Set(rolePermissions.map((item) => item.permission_key))
  };
}

export function hasCompanyPermission(membership: CompanyMembershipContext | null, permission: CompanyPermissionKey) {
  return Boolean(membership && membership.permissions.has(permission));
}

export const BASELINE_ROLES = ["owner", "staff", "read_only"] as const;
export const ADVANCED_ROLES = ["accountant", "auditor", "payroll_only", "sales_only", "integration_admin"] as const;

export function isBaselineRole(value: string): value is (typeof BASELINE_ROLES)[number] {
  return BASELINE_ROLES.includes(value as (typeof BASELINE_ROLES)[number]);
}

export function isAdvancedRole(value: string): value is (typeof ADVANCED_ROLES)[number] {
  return ADVANCED_ROLES.includes(value as (typeof ADVANCED_ROLES)[number]);
}
