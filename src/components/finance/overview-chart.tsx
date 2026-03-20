"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
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
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#b7bce1" />
            <YAxis tickLine={false} axisLine={false} stroke="#b7bce1" />
            <Tooltip contentStyle={{ background: "#171a36", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }} />
            <Line dataKey="revenue" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
            <Line dataKey="expenses" stroke="#fb7185" strokeWidth={2.5} dot={false} />
            <Line dataKey="profit" stroke="#4ade80" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
