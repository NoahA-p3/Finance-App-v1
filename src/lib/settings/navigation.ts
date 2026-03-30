import { isEntitlementReadEnabled } from "@/lib/auth-flags";
import { COMPANY_PERMISSIONS, CompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";

export type SettingsTabKey =
  | "personal"
  | "company"
  | "team-access"
  | "sales-documents"
  | "accounting-tax"
  | "banking-payments"
  | "integrations"
  | "automation"
  | "payroll"
  | "developer"
  | "security-audit";

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
  },
  {
    key: "automation",
    label: "Automation",
    description: "Automation rules, assistant preferences, and suggestion behavior controls.",
    href: "/settings/automation"
  },
  {
    key: "payroll",
    label: "Payroll",
    description: "Payroll setup defaults, mappings, and sensitive payroll control surfaces.",
    href: "/settings/payroll"
  },
  {
    key: "developer",
    label: "Developer",
    description: "OAuth clients, API keys, webhook URLs, scopes, and app credentials.",
    href: "/settings/developer"
  },
  {
    key: "security-audit",
    label: "Security & Audit",
    description: "Workspace security controls, audit visibility, and activity traceability settings.",
    href: "/settings/security-audit"
  }
];

const SETTINGS_TAB_BACKEND_READINESS: Record<SettingsTabKey, boolean> = {
  personal: true,
  company: true,
  "team-access": true,
  "sales-documents": true,
  "accounting-tax": true,
  "banking-payments": false,
  integrations: true,
  automation: false,
  payroll: false,
  developer: false,
  "security-audit": false
};

const OPTIONAL_TAB_FLAGS: Partial<Record<SettingsTabKey, string>> = {
  automation: "NEXT_PUBLIC_ENABLE_SETTINGS_AUTOMATION",
  payroll: "NEXT_PUBLIC_ENABLE_SETTINGS_PAYROLL",
  developer: "NEXT_PUBLIC_ENABLE_SETTINGS_DEVELOPER",
  "security-audit": "NEXT_PUBLIC_ENABLE_SETTINGS_SECURITY_AUDIT"
};

function isProductionLikeEnvironment() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}

function isBackendReady(key: SettingsTabKey) {
  return SETTINGS_TAB_BACKEND_READINESS[key];
}

function isOptionalTabEnabled(key: SettingsTabKey) {
  const flagName = OPTIONAL_TAB_FLAGS[key];

  if (!flagName) {
    return true;
  }

  const rawValue = process.env[flagName];

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  if (isProductionLikeEnvironment()) {
    return false;
  }

  return false;
}

export function getSettingsTabs(membership: CompanyMembershipContext | null) {
  const canManageCompanySettings = hasCompanyPermission(membership, COMPANY_PERMISSIONS.SETTINGS_MANAGE);
  const canReadTeam =
    hasCompanyPermission(membership, COMPANY_PERMISSIONS.MEMBERS_READ) ||
    hasCompanyPermission(membership, COMPANY_PERMISSIONS.MEMBERS_MANAGE) ||
    hasCompanyPermission(membership, COMPANY_PERMISSIONS.INVITATIONS_READ) ||
    hasCompanyPermission(membership, COMPANY_PERMISSIONS.INVITATIONS_MANAGE);

  const canAccessPayroll = canManageCompanySettings && isOptionalTabEnabled("payroll");
  const canAccessDeveloper = canManageCompanySettings && isOptionalTabEnabled("developer");
  const canAccessAutomation = canManageCompanySettings && isOptionalTabEnabled("automation");
  const canAccessSecurityAudit = canManageCompanySettings && isOptionalTabEnabled("security-audit");

  return TAB_DEFINITIONS.filter((tab) => {
    if (!isBackendReady(tab.key)) {
      return false;
    }

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

    if (tab.key === "automation") {
      return canAccessAutomation;
    }

    if (tab.key === "payroll") {
      return canAccessPayroll;
    }

    if (tab.key === "developer") {
      return canAccessDeveloper;
    }

    if (tab.key === "security-audit") {
      return canAccessSecurityAudit;
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
