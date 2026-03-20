import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Card } from "@/components/ui/card";
import { OverviewChart } from "@/components/finance/overview-chart";

export default function ReportsPage() {
  return (
    <DashboardShell title="Reports">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Revenue", "$48,200"],
          ["Expenses", "$16,450"],
          ["Net Profit", "$31,750"],
          ["Estimated Tax", "$8,460"]
        ].map(([label, value]) => (
          <Card key={label}><p className="text-sm text-indigo-200/70">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></Card>
        ))}
      </div>
      <div className="mt-4"><OverviewChart /></div>
    </DashboardShell>
  );
}
