import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <DashboardShell title="Settings">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Business Information</h3>
          <div className="mt-3 space-y-3">
            <Input placeholder="Business name" defaultValue="Acme Studio LLC" />
            <Input placeholder="Country" defaultValue="United States" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> VAT registered</label>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Tax Settings</h3>
          <div className="mt-3 space-y-3">
            <Input placeholder="Tax rate" defaultValue="26" />
            <Input placeholder="Bank connection" defaultValue="Plaid (placeholder)" />
            <Button className="w-full">Save settings</Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
