"use client";

import { DonutChart } from "@/components/charts/donut-chart";
import { Card } from "@/components/ui/card";
import type { ExpenseSlice } from "@/lib/dashboard-data";

const colors = ["#7dd3fc", "#c4b5fd", "#f9a8d4", "#86efac", "#fdba74", "#93c5fd"];

interface ExpenseBreakdownProps {
  items: ExpenseSlice[];
}

function formatPercent(value: bigint, total: bigint) {
  if (total === 0n) return "0%";
  return `${(Number((value * 10000n) / total) / 100).toFixed(2)}%`;
}

export function ExpenseBreakdown({ items }: ExpenseBreakdownProps) {
  const total = items.reduce((sum, item) => sum + BigInt(item.amountCents), 0n);

  return (
    <Card>
      <h3 className="text-base font-semibold text-white">Spending Activity</h3>
      {items.length > 0 ? (
        <>
          <DonutChart
            className="mt-4 h-[240px]"
            data={items}
            colors={colors}
            innerRadius={50}
            outerRadius={84}
            formatValue={(value, valueTotal) => formatPercent(value, valueTotal)}
          />
          <ul className="space-y-1 text-sm text-indigo-100/80">
            {items.slice(0, 4).map((item) => (
              <li key={item.name} className="flex justify-between">
                <span>{item.name}</span>
                <span>{formatPercent(BigInt(item.amountCents), total)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 py-8 text-center text-sm text-indigo-100/65">No expense transactions available yet.</p>
      )}
    </Card>
  );
}
