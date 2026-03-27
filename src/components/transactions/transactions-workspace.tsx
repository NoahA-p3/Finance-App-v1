"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { TransactionForm, TransactionFormValues } from "@/components/transactions/transaction-form";

interface TransactionRecord {
  id: string;
  description: string;
  amount: string | number;
  type: "expense" | "revenue";
  date: string;
  category_id: string | null;
  receipt_id: string | null;
}

interface UpgradePrompt {
  title?: string;
  body?: string;
  cta_label?: string;
}

interface EntitlementWarning {
  message?: string;
  code?: string;
}

interface TransactionApiBody {
  error?: string;
  upgrade_prompt?: UpgradePrompt | null;
  entitlement_warning?: EntitlementWarning | null;
}

function formatAmount(value: string | number) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(parsed);
}

export function TransactionsWorkspace() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as TransactionRecord[] | TransactionApiBody | null;

      if (!response.ok || !Array.isArray(body)) {
        const apiError = !Array.isArray(body) && body?.error ? body.error : "Unable to load transactions.";
        throw new Error(apiError);
      }

      setTransactions(body);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load transactions.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const handleCreate = useCallback(async (values: TransactionFormValues) => {
    setNotice(null);

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: values.date,
        category_id: values.category_id?.trim() ? values.category_id.trim() : undefined,
        receipt_id: values.receipt_id?.trim() ? values.receipt_id.trim() : undefined
      })
    });

    const body = (await response.json().catch(() => null)) as (TransactionRecord & TransactionApiBody) | TransactionApiBody | null;

    if (response.status === 429) {
      const lockMessage = body?.error ?? "Plan limit reached.";
      const promptMessage = body?.upgrade_prompt?.body ? ` ${body.upgrade_prompt.body}` : "";
      throw new Error(`${lockMessage}${promptMessage}`.trim());
    }

    if (!response.ok) {
      throw new Error(body?.error ?? "Unable to create transaction.");
    }

    const created = body as TransactionRecord & TransactionApiBody;
    setTransactions((current) => [created, ...current]);

    const warningMessage = created.entitlement_warning?.message;
    const promptBody = created.upgrade_prompt?.body;

    if (warningMessage || promptBody) {
      setNotice([warningMessage, promptBody].filter(Boolean).join(" "));
    }
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return <p className="py-8 text-center text-sm text-indigo-100/70">Loading persisted transactions...</p>;
    }

    if (error) {
      return <p className="py-8 text-center text-sm text-rose-300">{error}</p>;
    }

    if (transactions.length === 0) {
      return <p className="py-8 text-center text-sm text-indigo-100/70">No persisted transactions found.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-indigo-100/90">
          <thead className="text-xs uppercase text-indigo-200/60">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Description</th>
              <th className="py-2">Type</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Category ID</th>
              <th className="py-2">Receipt ID</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-white/10">
                <td className="py-3">{transaction.date}</td>
                <td>{transaction.description}</td>
                <td className={transaction.type === "expense" ? "text-rose-300" : "text-emerald-300"}>{transaction.type}</td>
                <td>{formatAmount(transaction.amount)}</td>
                <td>{transaction.category_id ?? "—"}</td>
                <td>{transaction.receipt_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [error, loading, transactions]);

  return (
    <div className="space-y-4">
      <TransactionForm onSubmit={handleCreate} />

      {notice ? <p className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{notice}</p> : null}

      <Card>{content}</Card>
    </div>
  );
}
