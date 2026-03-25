import { DashboardShell } from "@/components/shell/dashboard-shell";
import { AccountSecurityPanel } from "@/components/settings/account-security-panel";

export default function AccountPage() {
  return (
    <DashboardShell title="Account">
      <AccountSecurityPanel />
    </DashboardShell>
  );
}
