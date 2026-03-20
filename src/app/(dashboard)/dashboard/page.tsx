import { requireUser } from "@/lib/auth";
import { getSummary } from "@/lib/data";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RevenueExpenseChart } from "@/components/dashboard/revenue-expense-chart";
import { TaxWidget } from "@/components/dashboard/tax-widget";

export default async function DashboardPage() {
  const { user } = await requireUser();
  const summary = await getSummary(user.id);

  return (
    <div className="space-y-6">
      <SummaryCards revenue={summary.revenue} expenses={summary.expenses} balance={summary.balance} />
      <RevenueExpenseChart data={summary.points} />
      <TaxWidget revenue={summary.revenue} expenses={summary.expenses} />
    </div>
  );
}
