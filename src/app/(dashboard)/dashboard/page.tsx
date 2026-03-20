import { DashboardShell } from "@/components/shell/dashboard-shell";
import { KpiCards } from "@/components/finance/kpi-cards";
import { OverviewChart } from "@/components/finance/overview-chart";
import { ExpenseBreakdown } from "@/components/finance/expense-breakdown";
import { RecentTransactions } from "@/components/finance/recent-transactions";

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-4">
        <KpiCards />
        <OverviewChart />
        <div className="grid gap-4 lg:grid-cols-2">
          <ExpenseBreakdown />
          <RecentTransactions />
        </div>
      </div>
    </DashboardShell>
  );
}
