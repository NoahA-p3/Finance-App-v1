import { DashboardShell } from "@/components/shell/dashboard-shell";
import { TransactionsWorkspace } from "@/components/transactions/transactions-workspace";
import { NoCompanyState } from "@/components/shell/no-company-state";
import { requireUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";

export default async function TransactionsPage() {
  const { supabase, user } = await requireUser();
  const membership = await getCompanyMembershipContext(supabase, user.id);

  if (!membership) {
    return (
      <DashboardShell title="Transactions">
        <NoCompanyState />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Transactions">
      <TransactionsWorkspace />
    </DashboardShell>
  );
}
