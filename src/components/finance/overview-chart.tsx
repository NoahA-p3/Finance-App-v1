"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { trendData } from "@/lib/mock-data";

export function OverviewChart() {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Revenue vs Expenses</h3>
          <p className="text-sm text-slate-500">18 transactions automatically categorized</p>
        </div>
        <div className="flex gap-2 text-xs">
          {['7D', '30D', '90D', '12M'].map((period) => (
            <button key={period} className={`rounded-lg px-2.5 py-1 ${period === '12M' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Line dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={false} />
            <Line dataKey="expenses" stroke="#f97316" strokeWidth={2.5} dot={false} />
            <Line dataKey="profit" stroke="#16a34a" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
