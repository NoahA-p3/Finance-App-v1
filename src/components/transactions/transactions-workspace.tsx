"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { TransactionForm, TransactionFormValues } from "@/components/transactions/transaction-form";
import { CategoryManager, type Category } from "@/components/transactions/category-manager";
import { CategoryPicker } from "@/components/transactions/category-picker";
import { Button } from "@/components/ui/button";
import { formatCurrencyFromDecimalAmount, normalizeCurrencyCode } from "@/lib/money-format";

interface TransactionRecord {
  id: string;
  description: string;
  amount: string | number;
  type: "expense" | "revenue";
  date: string;
  category_id: string | null;
  receipt_id: string | null;
}

interface CategoryApiBody {
  error?: string;
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


interface CompanyApiResponse {
  settings?: {
    base_currency?: string | null;
  } | null;
}

export function TransactionsWorkspace() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currencyCode, setCurrencyCode] = useState("DKK");

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

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoryError(null);

    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as Category[] | CategoryApiBody | null;

      if (!response.ok || !Array.isArray(body)) {
        const apiError = !Array.isArray(body) && body?.error ? body.error : "Unable to load categories.";
        throw new Error(apiError);
      }

      setCategories(body);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load categories.";
      setCategoryError(message);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const loadCurrencyCode = useCallback(async () => {
    try {
      const response = await fetch("/api/companies", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as CompanyApiResponse | null;

      if (!response.ok) {
        setCurrencyCode("DKK");
        return;
      }

      setCurrencyCode(normalizeCurrencyCode(body?.settings?.base_currency));
    } catch {
      setCurrencyCode("DKK");
    }
  }, []);

  useEffect(() => {
    void loadCurrencyCode();
  }, [loadCurrencyCode]);

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

  const filteredTransactions = useMemo(() => {
    if (!categoryFilter) return transactions;
    return transactions.filter((transaction) => transaction.category_id === categoryFilter);
  }, [categoryFilter, transactions]);

  const content = useMemo(() => {
    if (loading) {
      return <p className="py-8 text-center text-sm text-indigo-100/70">Loading persisted transactions...</p>;
    }

    if (error) {
      return <p className="py-8 text-center text-sm text-rose-300">{error}</p>;
    }

    if (filteredTransactions.length === 0) {
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
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-white/10">
                <td className="py-3">{transaction.date}</td>
                <td>{transaction.description}</td>
                <td className={transaction.type === "expense" ? "text-rose-300" : "text-emerald-300"}>{transaction.type}</td>
                <td>{formatCurrencyFromDecimalAmount(transaction.amount, currencyCode)}</td>
                <td>{transaction.category_id ?? "—"}</td>
                <td>{transaction.receipt_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [currencyCode, error, filteredTransactions, loading]);

  return (
    <div className="space-y-4">
      <TransactionForm onSubmit={handleCreate} categories={categories} />

      <Card>
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-white">Filter transactions</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <CategoryPicker
              id="transactions-category-filter"
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              categories={categories}
              placeholder="All categories"
            />
          </div>
        </div>
      </Card>

      {categoryError ? <p className="rounded-xl border border-rose-300/40 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{categoryError}</p> : null}

      {loadingCategories ? <p className="text-sm text-indigo-100/70">Loading categories...</p> : null}

      {categories.length === 0 && !loadingCategories ? (
        <Card>
          <div className="space-y-3">
            <p className="text-sm text-indigo-100/80">No categories exist yet. Create your first category to tag transactions.</p>
            <Button type="button" onClick={() => document.getElementById("category-name-input")?.focus()}>
              Create first category
            </Button>
          </div>
        </Card>
      ) : null}

      <CategoryManager categories={categories} onCategoriesChange={setCategories} />

      {notice ? <p className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{notice}</p> : null}

      <Card>{content}</Card>
    </div>
  );
}
