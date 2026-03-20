import { DashboardShell } from "@/components/shell/dashboard-shell";
import { KpiCards } from "@/components/finance/kpi-cards";
import { OverviewChart } from "@/components/finance/overview-chart";
import { ExpenseBreakdown } from "@/components/finance/expense-breakdown";
import { RecentTransactions } from "@/components/finance/recent-transactions";

const projectTabs = ["Overview", "Cash Flow", "Budget", "Receipts", "Forecasts"];

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-4">
        <section className="rounded-2xl border border-white/10 bg-[#22254a] p-3">
          <div className="flex flex-wrap gap-2">
            {projectTabs.map((tab, index) => (
              <button
                key={tab}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  index === 0 ? "bg-cyan-300 text-[#1c1f3e]" : "bg-white/5 text-indigo-100 hover:bg-white/10"
                }`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </section>
        <KpiCards />
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <OverviewChart />
          <ExpenseBreakdown />
        </div>
        <RecentTransactions />
      </div>
    </DashboardShell>
  );
}
