import { COMPANY_PERMISSIONS, CompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";
import { isEntitlementReadEnabled } from "@/lib/auth-flags";

export type SettingsTabKey =
  | "personal"
  | "company"
  | "team-access"
  | "sales-documents"
  | "accounting-tax"
  | "banking-payments"
  | "integrations";

export interface SettingsTabDefinition {
  key: SettingsTabKey;
  label: string;
  description: string;
  href: string;
}

const TAB_DEFINITIONS: SettingsTabDefinition[] = [
  {
    key: "personal",
    label: "Personal",
    description: "Your profile, sign-in methods, security, sessions, and personal preferences.",
    href: "/settings/personal"
  },
  {
    key: "company",
    label: "Company",
    description: "Company identity, VAT registration status, fiscal defaults, and branding metadata.",
    href: "/settings/company"
  },
  {
    key: "team-access",
    label: "Team & Access",
    description: "Membership, invitations, role-based access, and company-level access controls.",
    href: "/settings/team-access"
  },
  {
    key: "sales-documents",
    label: "Sales & Documents",
    description: "Invoice and sales-document defaults such as numbering, terms, reminders, and templates.",
    href: "/settings/sales-documents"
  },
  {
    key: "accounting-tax",
    label: "Accounting & Tax",
    description: "Accounting policies, VAT configuration scaffolding, fiscal periods, and lock-date controls.",
    href: "/settings/accounting-tax"
  },
  {
    key: "banking-payments",
    label: "Banking & Payments",
    description: "Bank and payment-provider connection setup, mapping, and sync status surfaces.",
    href: "/settings/banking-payments"
  },
  {
    key: "integrations",
    label: "Integrations",
    description: "Third-party app connections, sync diagnostics, mapping, and retry surfaces.",
    href: "/settings/integrations"
  }
];

export function getSettingsTabs(membership: CompanyMembershipContext | null) {
  const canManageCompanySettings = hasCompanyPermission(membership, COMPANY_PERMISSIONS.SETTINGS_MANAGE);
  const canReadTeam =
    hasCompanyPermission(membership, COMPANY_PERMISSIONS.MEMBERS_READ) ||
    hasCompanyPermission(membership, COMPANY_PERMISSIONS.MEMBERS_MANAGE) ||
    hasCompanyPermission(membership, COMPANY_PERMISSIONS.INVITATIONS_READ) ||
    hasCompanyPermission(membership, COMPANY_PERMISSIONS.INVITATIONS_MANAGE);

  return TAB_DEFINITIONS.filter((tab) => {
    if (tab.key === "personal") {
      return true;
    }

    if (!membership) {
      return false;
    }

    if (tab.key === "team-access") {
      return canReadTeam;
    }

    if (tab.key === "company") {
      return true;
    }

    return canManageCompanySettings;
  });
}

export function getTabByKey(tabs: SettingsTabDefinition[], key: string | null | undefined) {
  if (!key) {
    return null;
  }

  return tabs.find((tab) => tab.key === key) ?? null;
}

export function shouldShowEntitlementsPanel() {
  return isEntitlementReadEnabled();
}
