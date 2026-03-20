"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recentTransactions } from "@/lib/mock-data";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const statusStyles: Record<string, string> = {
  Settled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  Review: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  "Auto-categorized": "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [selectedStatus, setSelectedStatus] = useState("All status");

  const categories = useMemo(
    () => ["All categories", ...new Set(recentTransactions.map((row) => row.category))],
    []
  );

  const statuses = useMemo(
    () => ["All status", ...new Set(recentTransactions.map((row) => row.status))],
    []
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return recentTransactions.filter((row) => {
      const isCategoryMatch = selectedCategory === "All categories" || row.category === selectedCategory;
      const isStatusMatch = selectedStatus === "All status" || row.status === selectedStatus;
      const isSearchMatch =
        normalizedSearch.length === 0 ||
        row.merchant.toLowerCase().includes(normalizedSearch) ||
        String(Math.abs(row.amount)).includes(normalizedSearch);

      return isCategoryMatch && isStatusMatch && isSearchMatch;
    });
  }, [search, selectedCategory, selectedStatus]);

  const hasActiveFilters = search.length > 0 || selectedCategory !== "All categories" || selectedStatus !== "All status";

  return (
    <DashboardShell title="Transactions">
      <Card>
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Showing <span className="font-semibold text-slate-900 dark:text-slate-50">{filteredTransactions.length}</span>{" "}
            of {recentTransactions.length} transactions
          </p>
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              className="w-fit"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All categories");
                setSelectedStatus("All status");
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search merchant or amount..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2">Date</th>
                <th className="pb-2">Merchant</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Receipt</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-3 text-slate-600 dark:text-slate-300">{row.date}</td>
                  <td className="font-medium text-slate-900 dark:text-slate-100">{row.merchant}</td>
                  <td className={row.amount < 0 ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"}>
                    {row.amount < 0 ? "-" : ""}
                    {CURRENCY.format(Math.abs(row.amount))}
                  </td>
                  <td>{row.category}</td>
                  <td>{row.receipt}</td>
                  <td>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusStyles[row.status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            No transactions found. Adjust your filters or search term.
          </div>
        ) : null}
      </Card>
    </DashboardShell>
  );
}
