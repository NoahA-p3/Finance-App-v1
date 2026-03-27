"use client";

import { LineChart } from "@/components/charts/line-chart";

interface Point {
  date: string;
  revenue: number;
  expenses: number;
}

export function RevenueExpenseChart({ data }: { data: Point[] }) {
  return (
    <div className="h-80 rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Revenue vs Expenses</h3>
      <LineChart
        className="h-[90%]"
        data={data}
        xKey="date"
        series={[
          { key: "revenue", label: "Revenue", color: "#10B981" },
          { key: "expenses", label: "Expenses", color: "#F43F5E" },
        ]}
        gridColor="rgba(15,23,42,0.12)"
        axisColor="rgba(15,23,42,0.35)"
        tickColor="#334155"
      />
    </div>
  );
}
