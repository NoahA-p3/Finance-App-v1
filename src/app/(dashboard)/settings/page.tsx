import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SessionsPanel } from "@/components/settings/sessions-panel";
import { isSessionManagementEnabled } from "@/lib/auth-flags";

export default function SettingsPage() {
  const isSessionPanelEnabled = isSessionManagementEnabled();

  return (
    <DashboardShell title="Settings">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold text-white">Business Information</h3>
          <div className="mt-3 space-y-3 text-indigo-100/90">
            <Input placeholder="Business name" defaultValue="Acme Studio LLC" />
            <Input placeholder="Country" defaultValue="United States" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" /> VAT registered
            </label>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-white">Tax Settings</h3>
          <div className="mt-3 space-y-3">
            <Input placeholder="Tax rate" defaultValue="26" />
            <Input placeholder="Bank connection" defaultValue="Plaid (placeholder)" />
            <Button className="w-full">Save settings</Button>
          </div>
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
