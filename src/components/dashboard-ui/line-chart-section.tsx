"use client";

/**
 * LineChartSection visualizes monthly income trend data with placeholder values.
 * Recharts is used to keep this chart component reusable and easy to extend.
 */
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={incomeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3C426B" />
          <XAxis dataKey="month" stroke="#A5B4FC" />
          <YAxis stroke="#A5B4FC" />
          <Tooltip contentStyle={{ backgroundColor: "#1E213A", border: "1px solid #4F46E5", borderRadius: 12 }} />
          <Line type="monotone" dataKey="income" stroke="#22D3EE" strokeWidth={3} dot={{ fill: "#22D3EE", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
