"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RecentTransactionRow } from "@/lib/dashboard-data";
import { formatCurrencyFromCents } from "@/lib/dashboard-data";

interface RecentTransactionsProps {
  items: RecentTransactionRow[];
  currencyCode: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ReceiptOption {
  id: string;
  created_at: string;
}

interface TransactionDraft {
  categoryId: string;
  receiptId: string;
  notes: string;
}

function toDraft(row: RecentTransactionRow): TransactionDraft {
  return {
    categoryId: row.categoryId ?? "",
    receiptId: row.receiptId ?? "",
    notes: row.notes ?? ""
  };
}

export function RecentTransactions({ items, currencyCode }: RecentTransactionsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rows, setRows] = useState(items);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [receipts, setReceipts] = useState<ReceiptOption[]>([]);
  const [draft, setDraft] = useState<TransactionDraft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRows(items);
  }, [items]);

  useEffect(() => {
    let cancelled = false;

    async function fetchContextOptions() {
      const [categoriesResponse, receiptsResponse] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/receipts", { cache: "no-store" })
      ]);

      if (!cancelled && categoriesResponse.ok) {
        const categoryPayload = (await categoriesResponse.json()) as CategoryOption[];
        setCategories(
          categoryPayload
            .filter((item) => Boolean(item?.id) && typeof item?.name === "string")
            .map((item) => ({ id: item.id, name: item.name }))
        );
      }

      if (!cancelled && receiptsResponse.ok) {
        const receiptPayload = (await receiptsResponse.json()) as { receipts?: ReceiptOption[] };
        setReceipts((receiptPayload.receipts ?? []).filter((item) => Boolean(item?.id)));
      }
    }

    fetchContextOptions().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const active = rows.find((item) => item.id === activeId) ?? null;

  useEffect(() => {
    setDraft(active ? toDraft(active) : null);
    setSaveError(null);
  }, [activeId, active]);

  const categoryOptions = useMemo(() => {
    const fromApi = categories.map((category) => ({ id: category.id, name: category.name }));
    const activeCategory = active?.categoryId && active.category !== "Uncategorized" ? [{ id: active.categoryId, name: active.category }] : [];
    const merged = [...activeCategory, ...fromApi];
    const byId = new Map(merged.map((entry) => [entry.id, entry]));
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, active]);

  async function saveDraft() {
    if (!active || !draft) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const payload = {
      category_id: draft.categoryId || null,
      receipt_id: draft.receiptId || null,
      notes: draft.notes.trim() || null
    };

    try {
      const response = await fetch(`/api/transactions/${active.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responsePayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSaveError(typeof responsePayload?.error === "string" ? responsePayload.error : "Unable to update transaction.");
        return;
      }

      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== active.id) {
            return row;
          }

          const matchedCategory = categoryOptions.find((category) => category.id === payload.category_id);

          return {
            ...row,
            categoryId: payload.category_id,
            category: payload.category_id ? matchedCategory?.name ?? row.category : "Uncategorized",
            receiptId: payload.receipt_id,
            hasReceipt: Boolean(payload.receipt_id),
            notes: payload.notes,
            status: payload.receipt_id ? "Receipt linked" : "Needs receipt"
          };
        })
      );
    } catch {
      setSaveError("Unable to update transaction.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Card>
        <h3 className="mb-3 text-base font-semibold text-white">Transaction History</h3>
        {rows.length === 0 ? (
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
                {rows.map((row) => (
                  <tr key={row.id} onClick={() => setActiveId(row.id)} className="cursor-pointer border-t border-white/10 hover:bg-white/5">
                    <td className="py-3">{row.date}</td>
                    <td>{row.description}</td>
                    <td className={row.type === "revenue" ? "text-emerald-300" : "text-rose-300"}>{formatCurrencyFromCents(row.amountCents, currencyCode)}</td>
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
        {active && draft && (
          <div className="space-y-4 text-sm text-indigo-100/90">
            <p>
              <span className="text-indigo-200/70">Description:</span> {active.description}
            </p>
            <p>
              <span className="text-indigo-200/70">Amount:</span> {formatCurrencyFromCents(active.amountCents, currencyCode)}
            </p>
            <label className="block">
              <span className="mb-1 block text-indigo-200/70">Category</span>
              <select
                className="w-full rounded-xl border border-white/15 bg-[#171a36] px-3 py-2"
                value={draft.categoryId}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, categoryId: event.target.value } : prev))}
              >
                <option value="">Uncategorized</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-indigo-200/70">Receipt</span>
              <select
                className="w-full rounded-xl border border-white/15 bg-[#171a36] px-3 py-2"
                value={draft.receiptId}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, receiptId: event.target.value } : prev))}
              >
                <option value="">No receipt linked</option>
                {receipts.map((receipt) => (
                  <option key={receipt.id} value={receipt.id}>
                    {receipt.created_at.slice(0, 10)} · {receipt.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-indigo-200/70">Notes</span>
              <Input
                placeholder="Add context for bookkeeping..."
                value={draft.notes}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, notes: event.target.value } : prev))}
              />
            </label>
            {saveError ? <p className="text-xs text-rose-300">{saveError}</p> : null}
            <Button variant="secondary" className="w-full" onClick={saveDraft} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
