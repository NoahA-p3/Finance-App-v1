import { DashboardShell } from "@/components/shell/dashboard-shell";
import { TransactionsWorkspace } from "@/components/transactions/transactions-workspace";

export default function TransactionsPage() {
  return (
    <DashboardShell title="Transactions">
      <TransactionsWorkspace />
    </DashboardShell>
  );
}
