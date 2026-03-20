interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "expense" | "revenue";
  date: string;
  categories: { name: string } | null;
  receipts: { path: string } | null;
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Transactions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2">Date</th>
              <th className="pb-2">Description</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">{t.date}</td>
                <td>{t.description}</td>
                <td>{t.categories?.name ?? "Uncategorized"}</td>
                <td className={t.type === "expense" ? "text-rose-600" : "text-emerald-600"}>{t.type}</td>
                <td>${t.amount.toFixed(2)}</td>
                <td>{t.receipts ? "Matched" : "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
