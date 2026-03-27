"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryPicker } from "@/components/transactions/category-picker";
import type { Category } from "@/components/transactions/category-manager";

export type TransactionType = "expense" | "revenue";

export interface TransactionFormValues {
  description: string;
  amount: string;
  type: TransactionType;
  date: string;
  category_id?: string;
  receipt_id?: string;
}

const INITIAL_VALUES: TransactionFormValues = {
  description: "",
  amount: "",
  type: "expense",
  date: new Date().toISOString().slice(0, 10),
  category_id: "",
  receipt_id: ""
};

interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  categories: Category[];
}

export function TransactionForm({ onSubmit, categories }: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>(INITIAL_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return values.description.trim().length > 0 && values.amount.trim().length > 0 && values.date.trim().length > 0;
  }, [values.amount, values.date, values.description]);

  const updateField = <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Description, amount, and date are required.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(values);
      setValues(INITIAL_VALUES);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to create transaction.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4 rounded-2xl border border-white/10 bg-[#171a36] p-4" onSubmit={handleSubmit}>
      <h2 className="text-base font-semibold text-white">Create transaction</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-indigo-100/85">
          Description
          <Input value={values.description} onChange={(event) => updateField("description", event.target.value)} placeholder="e.g. Office supplies" className="mt-1" />
        </label>

        <label className="text-sm text-indigo-100/85">
          Amount
          <Input
            type="text"
            inputMode="decimal"
            value={values.amount}
            onChange={(event) => updateField("amount", event.target.value)}
            placeholder="e.g. 499.95"
            className="mt-1"
          />
        </label>

        <label className="text-sm text-indigo-100/85">
          Type
          <select
            value={values.type}
            onChange={(event) => updateField("type", event.target.value as TransactionType)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0f1230] px-3 py-2 text-sm text-indigo-100"
          >
            <option value="expense">Expense</option>
            <option value="revenue">Revenue</option>
          </select>
        </label>

        <label className="text-sm text-indigo-100/85">
          Date
          <Input type="date" value={values.date} onChange={(event) => updateField("date", event.target.value)} className="mt-1" />
        </label>

        <CategoryPicker
          id="transaction-category"
          label="Category (optional)"
          value={values.category_id ?? ""}
          onChange={(value) => updateField("category_id", value)}
          categories={categories}
          placeholder={categories.length > 0 ? "Select category" : "No categories available"}
        />

        <label className="text-sm text-indigo-100/85">
          Receipt ID (optional)
          <Input
            value={values.receipt_id ?? ""}
            onChange={(event) => updateField("receipt_id", event.target.value)}
            placeholder="UUID"
            className="mt-1"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <Button type="submit" disabled={submitting || !canSubmit}>
        {submitting ? "Creating..." : "Create transaction"}
      </Button>
    </form>
  );
}
