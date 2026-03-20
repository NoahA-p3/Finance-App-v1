"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { expenseBreakdown } from "@/lib/mock-data";

const colors = ["#2563eb", "#7c3aed", "#f97316", "#16a34a", "#0ea5e9", "#94a3b8"];

export function ExpenseBreakdown() {
  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Expense Breakdown</h3>
      <div className="mt-4 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>
              {expenseBreakdown.map((item, index) => (
                <Cell key={item.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
