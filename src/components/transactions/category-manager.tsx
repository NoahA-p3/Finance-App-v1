"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");

  const addCategory = async () => {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (response.ok) {
      const created = await response.json();
      setCategories((prev) => [created, ...prev]);
      setName("");
    }
  };

  const deleteCategory = async (id: string) => {
    const response = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Categories</h2>
      <div className="mb-3 flex gap-2">
        <input className="w-full rounded-lg border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="rounded-lg bg-slate-900 px-3 py-2 text-white" onClick={addCategory}>
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between rounded border p-2">
            <span>{category.name}</span>
            <button className="text-sm text-rose-600" onClick={() => deleteCategory(category.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
