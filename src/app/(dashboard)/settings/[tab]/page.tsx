import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { AccountSecurityPanel } from "@/components/settings/account-security-panel";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { EntitlementsPanel } from "@/components/settings/entitlements-panel";
import { SessionsPanel } from "@/components/settings/sessions-panel";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { isSessionManagementEnabled } from "@/lib/auth-flags";
import { getSettingsTabs, getTabByKey, shouldShowEntitlementsPanel } from "@/lib/settings/navigation";

function Placeholder({ title, description, bullets }: { title: string; description: string; bullets: string[] }) {
  return (
    <Card>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-indigo-100/80">{description}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-indigo-100/75">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </Card>
  );
}

export default async function SettingsTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  const { supabase, user } = await requireUser();
  const membership = await getCompanyMembershipContext(supabase, user.id);
  const tabs = getSettingsTabs(membership);
  const activeTab = getTabByKey(tabs, tab);

  if (!activeTab) {
    if (tab === "account") {
      redirect("/settings/personal");
    }

    notFound();
  }

  return (
    <DashboardShell title={`Settings · ${activeTab.label}`}>
      <Card>
        <h2 className="text-xl font-semibold text-white">{activeTab.label}</h2>
        <p className="mt-2 text-sm text-indigo-100/80">{activeTab.description}</p>
        <div className="mt-5">
          <SettingsNav tabs={tabs} activeTabKey={activeTab.key} />
        </div>
      </Card>

      <div className="mt-4 space-y-4">
        {activeTab.key === "personal" ? (
          <>
            <AccountSecurityPanel />
            {isSessionManagementEnabled() ? (
              <SessionsPanel />
            ) : (
              <Card>
                <h3 className="font-semibold text-white">Active Sessions</h3>
                <p className="mt-2 text-sm text-indigo-100/75">Session management is temporarily disabled in this environment.</p>
              </Card>
            )}
          </>
        ) : null}

        {activeTab.key === "company" ? (
          <>
            <CompanyProfileForm />
            {shouldShowEntitlementsPanel() ? <EntitlementsPanel /> : null}
          </>
        ) : null}

        {activeTab.key === "team-access" ? (
          <Placeholder
            title="Team & Access setup"
            description="This section is reserved for member invites, member list administration, role controls, and access visibility settings."
            bullets={[
              "Use company invitation and member APIs as the implementation path for future UI work.",
              "Keep permission checks strict for role changes and invite actions.",
              "Do not move operational workflows here; only access configuration belongs in this tab."
            ]}
          />
        ) : null}

        {activeTab.key === "sales-documents" ? (
          <>
            <Placeholder
              title="Sales document defaults"
              description="Invoice-related defaults currently live in Company Profile and will be split into dedicated document settings pages incrementally."
              bullets={[
                "Existing persisted fields include invoice prefix, invoice terms, and default due days.",
                "Future pages should cover template defaults, reminder defaults, recurring billing defaults, and payment link defaults where supported.",
                "Operational sales workflows (quotes/invoices) remain outside Settings."
              ]}
            />
            <Card>
              <p className="text-sm text-indigo-100/80">
                Manage currently available invoice defaults in <Link href="/settings/company" className="font-semibold text-cyan-200 underline">Company</Link> until dedicated Sales & Documents forms are extracted.
              </p>
            </Card>
          </>
        ) : null}

        {activeTab.key === "accounting-tax" ? (
          <>
            <Placeholder
              title="Accounting & Tax"
              description="Accounting correctness and VAT setup are planned. This area intentionally exposes only implemented configuration and explicit placeholders."
              bullets={[
                "Fiscal year and VAT registration controls are currently available through Company profile settings.",
                "VAT engine and tax-rule automation are planned and not fully implemented yet.",
                "Future work should add lock dates, ledger policies, VAT code mappings, and filing setup surfaces."
              ]}
            />
            <Card>
              <h3 className="font-semibold text-white">Tax setup status</h3>
              <p className="mt-2 text-sm text-indigo-100/80">TODO: VAT engine and tax-rule automation are planned and not fully implemented yet.</p>
            </Card>
          </>
        ) : null}

        {activeTab.key === "banking-payments" ? (
          <Placeholder
            title="Banking & Payments"
            description="This tab is reserved for bank connections, account mapping, payment provider setup, and sync/webhook status surfaces."
            bullets={[
              "Do not place reconciliation workflows here; only connection and default setup belongs in this tab.",
              "When implemented, include explicit sync status and error visibility.",
              "Manual import defaults and bank-to-ledger mappings should be configured here."
            ]}
          />
        ) : null}

        {activeTab.key === "integrations" ? (
          <Placeholder
            title="Integrations"
            description="This tab is for third-party connections and integration operational status, including sync health and traceability metadata."
            bullets={[
              "When implemented, include connect/disconnect, configuration, and last sync/error details.",
              "Expose retry actions and field mappings only when backed by persisted integration models.",
              "Keep day-to-day accounting and sales workflows outside this tab."
            ]}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}
