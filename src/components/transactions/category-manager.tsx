"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Category {
  id: string;
  name: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

export function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed })
    });

    if (response.ok) {
      const created = await response.json();
      onCategoriesChange([created, ...categories].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setSubmitting(false);
      return;
    }

    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(body?.error ?? "Unable to create category.");
    setSubmitting(false);
  };

  const deleteCategory = async (id: string) => {
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const response = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      onCategoriesChange(categories.filter((category) => category.id !== id));
      setSubmitting(false);
      return;
    }

    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(body?.error ?? "Unable to delete category.");
    setSubmitting(false);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#171a36] p-4">
      <h2 className="mb-3 text-base font-semibold text-white">Categories</h2>
      <div className="mb-3 flex gap-2">
        <Input
          id="category-name-input"
          className="w-full"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Category name"
        />
        <Button type="button" onClick={addCategory} disabled={submitting || !name.trim()}>
          Add
        </Button>
      </div>
      {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0f1230] p-2 text-indigo-100/90">
            <span>{category.name}</span>
            <button className="text-sm text-rose-300" onClick={() => deleteCategory(category.id)} disabled={submitting}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
