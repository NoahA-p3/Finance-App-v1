"use client";

import { Card } from "@/components/ui/card";
import { LineChart } from "@/components/charts/line-chart";
import { trendData } from "@/lib/mock-data";

export function OverviewChart() {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Cash Flow Trend</h3>
          <p className="text-sm text-indigo-100/65">Revenue, expenses, and profit over time</p>
        </div>
        <div className="flex gap-2 text-xs">
          {["30D", "90D", "6M", "12M"].map((period) => (
            <button key={period} className={`rounded-lg px-2.5 py-1 ${period === "12M" ? "bg-cyan-300 text-[#1c1f3e]" : "bg-white/10 text-indigo-100"}`}>
              {period}
            </button>
          ))}
        </div>
      </div>
      <LineChart
        className="h-[280px]"
        data={trendData}
        xKey="label"
        series={[
          { key: "revenue", label: "Revenue", color: "#38bdf8" },
          { key: "expenses", label: "Expenses", color: "#fb7185" },
          { key: "profit", label: "Profit", color: "#4ade80" },
        ]}
      />
    </Card>
  );
}
