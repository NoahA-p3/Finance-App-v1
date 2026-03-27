import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Card } from "@/components/ui/card";
import { OverviewChart } from "@/components/finance/overview-chart";
import { NoCompanyState } from "@/components/shell/no-company-state";
import { requireUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { formatCurrencyFromCents, getDashboardFinanceData } from "@/lib/dashboard-data";

export default async function ReportsPage() {
  const { supabase, user } = await requireUser();
  const membership = await getCompanyMembershipContext(supabase, user.id);

  if (!membership) {
    return (
      <DashboardShell title="Reports">
        <NoCompanyState />
      </DashboardShell>
    );
  }

  const data = await getDashboardFinanceData(supabase, user.id, membership.companyId);

  return (
    <DashboardShell title="Reports">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((kpi) => (
          <Card key={kpi.title}>
            <p className="text-sm text-indigo-200/70">{kpi.title}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyFromCents(kpi.amountCents)}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <OverviewChart data={data.trendData} />
      </div>
    </DashboardShell>
  );
}
