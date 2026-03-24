"use client";

import { DonutChart } from "@/components/charts/donut-chart";
import { Card } from "@/components/ui/card";
import { expenseBreakdown } from "@/lib/mock-data";

const colors = ["#7dd3fc", "#c4b5fd", "#f9a8d4", "#86efac", "#fdba74", "#93c5fd"];

export function ExpenseBreakdown() {
  return (
    <Card>
      <h3 className="text-base font-semibold text-white">Spending Activity</h3>
      <DonutChart className="mt-4 h-[240px]" data={expenseBreakdown} colors={colors} innerRadius={50} outerRadius={84} />
      <ul className="space-y-1 text-sm text-indigo-100/80">
        {expenseBreakdown.slice(0, 4).map((item) => (
          <li key={item.name} className="flex justify-between">
            <span>{item.name}</span>
            <span>{item.value}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
