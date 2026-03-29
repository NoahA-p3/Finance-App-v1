import { createClient } from "@/lib/supabase/server";

export const COMPANY_PERMISSIONS = {
  SETTINGS_MANAGE: "company.settings.manage",
  MEMBERS_READ: "company.members.read",
  MEMBERS_MANAGE: "company.members.manage",
  INVITATIONS_READ: "company.invitations.read",
  INVITATIONS_MANAGE: "company.invitations.manage",
  FINANCE_TRANSACTIONS_WRITE: "finance.transactions.write",
  FINANCE_CATEGORIES_WRITE: "finance.categories.write",
  FINANCE_RECEIPTS_WRITE: "finance.receipts.write",
  FINANCE_POSTINGS_WRITE: "finance.postings.write",
  FINANCE_PERIOD_LOCKS_MANAGE: "finance.period_locks.manage"
} as const;

export type CompanyPermissionKey = (typeof COMPANY_PERMISSIONS)[keyof typeof COMPANY_PERMISSIONS];

export interface CompanyMembershipContext {
  companyId: string;
  companyName: string | null;
  role: string;
  permissions: Set<string>;
}

export interface CompanyMembershipSummary {
  companyId: string;
  companyName: string | null;
  role: string;
  createdAt: string;
}

async function getRolePermissions(supabase: Awaited<ReturnType<typeof createClient>>, role: string) {
  const { data: rolePermissions, error: rolePermissionsError } = await supabase
    .from("role_permissions")
    .select("permission_key")
    .eq("role_key", role);

  if (rolePermissionsError) {
    return null;
  }

  return new Set(rolePermissions.map((item) => item.permission_key));
}

export async function listUserCompanyMemberships(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<CompanyMembershipSummary[]> {
  const { data: memberships, error } = await supabase
    .from("company_memberships")
    .select("company_id, role, created_at, companies(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !memberships) {
    return [];
  }

  return memberships.map((membership) => ({
    companyId: membership.company_id,
    companyName: (membership.companies as { name?: string } | null)?.name ?? null,
    role: membership.role,
    createdAt: membership.created_at
  }));
}

export async function getCompanyMembershipContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId?: string
): Promise<CompanyMembershipContext | null> {
  const memberships = await listUserCompanyMemberships(supabase, userId);
  if (memberships.length === 0) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("active_company_id").eq("id", userId).maybeSingle();
  const preferredCompanyId = companyId ?? profile?.active_company_id ?? null;

  const membership = preferredCompanyId
    ? memberships.find((entry) => entry.companyId === preferredCompanyId) ?? null
    : memberships[0] ?? null;

  if (!membership) {
    return null;
  }

  if (!preferredCompanyId || preferredCompanyId !== membership.companyId) {
    await supabase.from("profiles").update({ active_company_id: membership.companyId }).eq("id", userId);
  }

  const permissions = await getRolePermissions(supabase, membership.role);
  if (!permissions) {
    return null;
  }

  return {
    companyId: membership.companyId,
    companyName: membership.companyName,
    role: membership.role,
    permissions
  };
}

export function hasCompanyPermission(membership: CompanyMembershipContext | null, permission: CompanyPermissionKey) {
  return Boolean(membership && membership.permissions.has(permission));
}

export function canWriteFinanceTransactions(membership: CompanyMembershipContext | null) {
  return hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_TRANSACTIONS_WRITE);
}

export function canWriteFinanceReceipts(membership: CompanyMembershipContext | null) {
  return hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_RECEIPTS_WRITE);
}

export function canWriteFinancePostings(membership: CompanyMembershipContext | null) {
  return hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_POSTINGS_WRITE);
}

export function canManageFinancePeriodLocks(membership: CompanyMembershipContext | null) {
  return hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_PERIOD_LOCKS_MANAGE);
}

export const BASELINE_ROLES = ["owner", "staff", "read_only"] as const;
export const ADVANCED_ROLES = ["accountant", "auditor", "payroll_only", "sales_only", "integration_admin"] as const;

export function isBaselineRole(value: string): value is (typeof BASELINE_ROLES)[number] {
  return BASELINE_ROLES.includes(value as (typeof BASELINE_ROLES)[number]);
}

export function isAdvancedRole(value: string): value is (typeof ADVANCED_ROLES)[number] {
  return ADVANCED_ROLES.includes(value as (typeof ADVANCED_ROLES)[number]);
}
