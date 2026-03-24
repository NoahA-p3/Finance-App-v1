"use client";

/**
 * LineChartSection visualizes monthly income trend data with placeholder values.
 * A shared SVG line chart utility is used to keep this component reusable and easy to extend.
 */
import { LineChart } from "@/components/charts/line-chart";

const incomeData = [
  { month: "Jan", income: 3400 },
  { month: "Feb", income: 4200 },
  { month: "Mar", income: 3900 },
  { month: "Apr", income: 5100 },
  { month: "May", income: 4700 },
  { month: "Jun", income: 5600 },
  { month: "Jul", income: 6200 }
];

export default function LineChartSection() {
  return (
    <section className="h-[320px] rounded-2xl bg-[#272B4A] p-5 shadow-lg">
      <h3 className="mb-1 text-lg font-semibold text-slate-100">Total Income</h3>
      <p className="mb-4 text-sm text-slate-300">Monthly trend (dummy data)</p>
      <LineChart
        className="h-[80%]"
        data={incomeData}
        xKey="month"
        series={[{ key: "income", label: "Income", color: "#22D3EE" }]}
        gridColor="#3C426B"
        axisColor="#4B5A8D"
        tickColor="#A5B4FC"
      />
    </section>
  );
}
