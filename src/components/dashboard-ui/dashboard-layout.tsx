/**
 * DashboardLayout composes all dashboard UI sections into the requested structure.
 * It keeps the page shell reusable while delegating each section to focused components.
 */
import SideNav from "@/components/dashboard-ui/side-nav";
import TopBar from "@/components/dashboard-ui/top-bar";
import KpiCards from "@/components/dashboard-ui/kpi-cards";
import LineChartSection from "@/components/dashboard-ui/line-chart-section";
import DonutChartSection from "@/components/dashboard-ui/donut-chart-section";
import TransactionHistoryTable from "@/components/dashboard-ui/transaction-history-table";
import GoalsPanel from "@/components/dashboard-ui/goals-panel";

interface DashboardLayoutProps {
  name: string;
}

export default function DashboardLayout({ name }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#1F203A] p-4 text-slate-100 md:p-6">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 lg:flex-row">
        <SideNav />

        <main className="flex-1 space-y-6">
          <TopBar name={name} />
          <KpiCards />

          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <LineChartSection />
            <DonutChartSection />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <TransactionHistoryTable />
            <GoalsPanel />
          </section>
        </main>
      </div>
    </div>
  );
}
