"use client";

/**
 * DonutChartSection displays expense activity distribution with mock categories.
 * The donut chart complements the line chart for quick spending pattern review.
 */
import { DonutChart } from "@/components/charts/donut-chart";

const expenseActivity = [
  { name: "Housing", value: 32 },
  { name: "Food", value: 24 },
  { name: "Transport", value: 16 },
  { name: "Leisure", value: 14 },
  { name: "Utilities", value: 14 }
];

const colors = ["#22D3EE", "#818CF8", "#F472B6", "#FBBF24", "#34D399"];

export default function DonutChartSection() {
  return (
    <section className="h-[320px] rounded-2xl bg-[#272B4A] p-5 shadow-lg">
      <h3 className="mb-1 text-lg font-semibold text-slate-100">Activity Breakdown</h3>
      <p className="mb-3 text-sm text-slate-300">Expense split (dummy data)</p>

      <DonutChart className="h-[75%]" data={expenseActivity} colors={colors} innerRadius={58} outerRadius={88} />

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
        {expenseActivity.map((item, index) => (
          <p key={item.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            {item.name}: {item.value}%
          </p>
        ))}
      </div>
    </section>
  );
}
