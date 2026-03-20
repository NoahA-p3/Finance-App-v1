import { Card } from "@/components/ui/card";
import { kpiData } from "@/lib/mock-data";

export function KpiCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <p className="text-sm text-slate-500">{kpi.title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">${kpi.amount.toLocaleString()}</p>
          <p className="mt-2 text-xs text-emerald-600">{kpi.delta}</p>
          <div className="mt-4 h-8 rounded-lg bg-gradient-to-r from-indigo-50 to-slate-100" />
        </Card>
      ))}
    </div>
  );
}
