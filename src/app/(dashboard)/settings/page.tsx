import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Card } from "@/components/ui/card";
import { SettingsNav } from "@/components/settings/settings-nav";
import { requireUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { getSettingsTabs } from "@/lib/settings/navigation";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const membership = await getCompanyMembershipContext(supabase, user.id);
  const tabs = getSettingsTabs(membership);

  if (tabs.length === 0) {
    redirect("/settings/personal");
  }

  return (
    <DashboardShell title="Settings">
      <Card>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="mt-2 text-sm text-indigo-100/80">
          Configure account, company defaults, permissions, accounting policies, and connected services from one structured area.
        </p>
        <div className="mt-5">
          <SettingsNav tabs={tabs} />
        </div>
      </Card>
    </DashboardShell>
  );
}
