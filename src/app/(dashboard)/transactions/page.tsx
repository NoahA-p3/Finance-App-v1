import { DashboardShell } from "@/components/shell/dashboard-shell";
import { TransactionsWorkspace } from "@/components/transactions/transactions-workspace";
import { NoCompanyState } from "@/components/shell/no-company-state";

  if (!membership) {
    return (
      <DashboardShell title="Transactions">
        <NoCompanyState />
      </DashboardShell>
    );
  }

  const data = await getDashboardFinanceData(supabase, user.id, membership.companyId);

export default function TransactionsPage() {
  return (
    <DashboardShell title="Transactions">
      <TransactionsWorkspace />
    </DashboardShell>
  );
}
