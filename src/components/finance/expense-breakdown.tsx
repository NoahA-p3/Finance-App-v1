"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { expenseBreakdown } from "@/lib/mock-data";

const colors = ["#7dd3fc", "#c4b5fd", "#f9a8d4", "#86efac", "#fdba74", "#93c5fd"];

export function ExpenseBreakdown() {
  return (
    <Card>
      <h3 className="text-base font-semibold text-white">Spending Activity</h3>
      <div className="mt-4 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>
              {expenseBreakdown.map((item, index) => (
                <Cell key={item.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#171a36", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
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
