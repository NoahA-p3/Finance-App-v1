"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recentTransactions } from "@/lib/mock-data";

export function RecentTransactions() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = recentTransactions.find((item) => item.id === activeId);

  return (
    <>
      <Card>
        <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2">Date</th><th>Merchant</th><th>Amount</th><th>Category</th><th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((row) => (
                <tr key={row.id} onClick={() => setActiveId(row.id)} className="cursor-pointer border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                  <td className="py-3">{row.date}</td><td>{row.merchant}</td><td className={row.amount > 0 ? "text-emerald-600" : "text-slate-700"}>${Math.abs(row.amount)}</td><td>{row.category}</td><td>{row.receipt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <aside className={`fixed right-0 top-0 z-30 h-full w-full max-w-md border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xl transition ${active ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-semibold">Transaction details</h4>
          <button onClick={() => setActiveId(null)}>✕</button>
        </div>
        {active && (
          <div className="space-y-4 text-sm">
            <p><span className="text-slate-500 dark:text-slate-400">Merchant:</span> {active.merchant}</p>
            <p><span className="text-slate-500 dark:text-slate-400">Amount:</span> ${Math.abs(active.amount)}</p>
            <label className="block">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">Category</span>
              <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                <option>Software</option><option>Marketing</option><option>Travel</option><option>Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">Notes</span>
              <Input placeholder="Add context for bookkeeping..." />
            </label>
            <Button variant="secondary" className="w-full">Upload receipt</Button>
          </div>
        )}
      </aside>
    </>
  );
}
