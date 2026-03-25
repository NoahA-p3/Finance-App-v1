"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RecentTransactionRow } from "@/lib/dashboard-data";
import { formatCurrencyFromCents } from "@/lib/dashboard-data";

interface RecentTransactionsProps {
  items: RecentTransactionRow[];
}

export function RecentTransactions({ items }: RecentTransactionsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((item) => item.id === activeId);
  const categoryOptions = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);

  return (
    <>
      <Card>
        <h3 className="mb-3 text-base font-semibold text-white">Transaction History</h3>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-indigo-100/65">No persisted transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-indigo-100/85">
              <thead className="text-xs uppercase text-indigo-200/60">
                <tr>
                  <th className="py-2">Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} onClick={() => setActiveId(row.id)} className="cursor-pointer border-t border-white/10 hover:bg-white/5">
                    <td className="py-3">{row.date}</td>
                    <td>{row.description}</td>
                    <td className={row.type === "revenue" ? "text-emerald-300" : "text-rose-300"}>{formatCurrencyFromCents(row.amountCents)}</td>
                    <td>{row.category}</td>
                    <td>{row.hasReceipt ? "Attached" : "Missing"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <aside className={`fixed right-0 top-0 z-30 h-full w-full max-w-md border-l border-white/10 bg-[#1e2143] p-5 shadow-2xl transition ${active ? "translate-x-0" : "translate-x-full"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-semibold text-white">Transaction details</h4>
          <button onClick={() => setActiveId(null)} className="text-indigo-200">✕</button>
        </div>
        {active && (
          <div className="space-y-4 text-sm text-indigo-100/90">
            <p>
              <span className="text-indigo-200/70">Description:</span> {active.description}
            </p>
            <p>
              <span className="text-indigo-200/70">Amount:</span> {formatCurrencyFromCents(active.amountCents)}
            </p>
            <label className="block">
              <span className="mb-1 block text-indigo-200/70">Category</span>
              <select className="w-full rounded-xl border border-white/15 bg-[#171a36] px-3 py-2" defaultValue={active.category}>
                {categoryOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-indigo-200/70">Notes</span>
              <Input placeholder="Add context for bookkeeping..." />
            </label>
            <Button variant="secondary" className="w-full">
              Upload receipt
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
