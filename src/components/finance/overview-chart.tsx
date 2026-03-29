"use client";

import { Card } from "@/components/ui/card";
import { LineChart } from "@/components/charts/line-chart";
import type { TrendPoint } from "@/lib/dashboard-data";
import { formatCurrencyFromCents } from "@/lib/dashboard-data";

interface OverviewChartProps {
  data: TrendPoint[];
}

export function OverviewChart({ data }: OverviewChartProps) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Cash Flow Trend</h3>
          <p className="text-sm text-indigo-100/65">Revenue, expenses, and profit over time</p>
        </div>
      </div>
      {data.length > 0 ? (
        <LineChart
          className="h-[280px]"
          data={data}
          xKey="label"
          getValue={(datum, key) => BigInt(String(datum[key]))}
          formatValue={(value) => formatCurrencyFromCents(value)}
          series={[
            { key: "revenueCents", label: "Revenue", color: "#38bdf8" },
            { key: "expensesCents", label: "Expenses", color: "#fb7185" },
            { key: "profitCents", label: "Profit", color: "#4ade80" }
          ]}
        />
      ) : (
        <p className="py-12 text-center text-sm text-indigo-100/65">No persisted transaction trend data yet.</p>
      )}
    </Card>
  );
}
