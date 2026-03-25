import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Card } from "@/components/ui/card";
import { SessionsPanel } from "@/components/settings/sessions-panel";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { isSessionManagementEnabled } from "@/lib/auth-flags";

export default function SettingsPage() {
  const isSessionPanelEnabled = isSessionManagementEnabled();

  return (
    <DashboardShell title="Settings">
      <div className="grid gap-4 lg:grid-cols-2">
        <CompanyProfileForm />
        <Card>
          <h3 className="font-semibold text-white">Tax Settings</h3>
          <p className="mt-2 text-sm text-indigo-100/80">
            TODO: VAT engine and tax-rule automation are planned and not fully implemented yet.
          </p>
        </Card>
      </div>

      {isSessionPanelEnabled ? (
        <div className="mt-4">
          <SessionsPanel />
        </div>
      ) : (
        <div className="mt-4">
          <Card>
            <h3 className="font-semibold text-white">Active Sessions</h3>
            <p className="mt-2 text-sm text-indigo-100/75">
              Session management is temporarily disabled in this environment.
            </p>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
