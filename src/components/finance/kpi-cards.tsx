import { Card } from "@/components/ui/card";
import type { DashboardKpi } from "@/lib/dashboard-data";
import { formatCurrencyFromCents } from "@/lib/dashboard-data";

const accent = ["from-cyan-400/35 to-sky-500/20", "from-blue-400/30 to-indigo-500/20", "from-pink-400/35 to-rose-500/20"];

interface KpiCardsProps {
  items: DashboardKpi[];
  currencyCode: string;
}

export function KpiCards({ items, currencyCode }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((kpi, index) => (
        <Card key={kpi.title}>
          <div className={`rounded-xl bg-gradient-to-br p-4 ${accent[index % accent.length]}`}>
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-100/70">{kpi.title}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatCurrencyFromCents(kpi.amountCents, currencyCode)}</p>
            <p className="mt-2 inline-flex rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-200">{kpi.delta}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
