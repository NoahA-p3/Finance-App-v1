"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Point {
  date: string;
  revenue: number;
  expenses: number;
}

export function RevenueExpenseChart({ data }: { data: Point[] }) {
  return (
    <div className="h-80 rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Revenue vs Expenses</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
          <Line type="monotone" dataKey="expenses" stroke="#F43F5E" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
