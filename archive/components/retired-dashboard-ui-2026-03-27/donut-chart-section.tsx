"use client";

import { DonutChart } from "@/components/charts/donut-chart";

const expenseActivity: Array<{ name: string; value: number }> = [];
const colors = ["#22D3EE", "#818CF8", "#F472B6", "#FBBF24", "#34D399"];

export default function DonutChartSection() {
  return (
    <section className="h-[320px] rounded-2xl bg-[#272B4A] p-5 shadow-lg">
      <h3 className="mb-1 text-lg font-semibold text-slate-100">Activity Breakdown</h3>
      {expenseActivity.length > 0 ? (
        <>
          <DonutChart className="h-[75%]" data={expenseActivity} colors={colors} innerRadius={58} outerRadius={88} />
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            {expenseActivity.map((item, index) => (
              <p key={item.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                {item.name}: {item.value}%
              </p>
            ))}
          </div>
        </>
      ) : (
        <p className="py-16 text-sm text-slate-300">No expense split data available yet.</p>
      )}
    </section>
  );
}
