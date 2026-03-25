import { DashboardShell } from "@/components/shell/dashboard-shell";
import { KpiCards } from "@/components/finance/kpi-cards";
import { OverviewChart } from "@/components/finance/overview-chart";
import { ExpenseBreakdown } from "@/components/finance/expense-breakdown";
import { RecentTransactions } from "@/components/finance/recent-transactions";
import { requireUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { getDashboardFinanceData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const membership = await getCompanyMembershipContext(supabase, user.id);

  const data = membership
    ? await getDashboardFinanceData(supabase, user.id, membership.companyId)
    : { kpis: [], trendData: [], expenseBreakdown: [], recentTransactions: [] };

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-4">
        <KpiCards items={data.kpis} />
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <OverviewChart data={data.trendData} />
          <ExpenseBreakdown items={data.expenseBreakdown} />
        </div>
        <RecentTransactions items={data.recentTransactions} />
      </div>
    </DashboardShell>
  );
}
