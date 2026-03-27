"use client";

import { LineChart } from "@/components/charts/line-chart";

const incomeData: Array<{ month: string; income: number }> = [];

export default function LineChartSection() {
  return (
    <section className="h-[320px] rounded-2xl bg-[#272B4A] p-5 shadow-lg">
      <h3 className="mb-1 text-lg font-semibold text-slate-100">Total Income</h3>
      {incomeData.length > 0 ? (
        <LineChart
          className="h-[80%]"
          data={incomeData}
          xKey="month"
          series={[{ key: "income", label: "Income", color: "#22D3EE" }]}
          gridColor="#3C426B"
          axisColor="#4B5A8D"
          tickColor="#A5B4FC"
        />
      ) : (
        <p className="py-16 text-sm text-slate-300">No trend data available yet.</p>
      )}
    </section>
  );
}
