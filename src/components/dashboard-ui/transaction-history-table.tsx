/**
 * TransactionHistoryTable renders a reusable transaction list using temporary mock rows.
 * The table is horizontally scrollable on smaller widths for responsive behavior.
 */
const transactions = [
  { id: "TRX-2301", date: "Mar 14, 2026", description: "Salary Deposit", category: "Income", amount: "+$4,300" },
  { id: "TRX-2302", date: "Mar 15, 2026", description: "Groceries", category: "Food", amount: "-$134" },
  { id: "TRX-2303", date: "Mar 16, 2026", description: "Rent Payment", category: "Housing", amount: "-$1,280" },
  { id: "TRX-2304", date: "Mar 17, 2026", description: "Stock Dividend", category: "Invest", amount: "+$210" },
  { id: "TRX-2305", date: "Mar 18, 2026", description: "Internet Bill", category: "Utilities", amount: "-$72" }
];

export default function TransactionHistoryTable() {
  return (
    <section className="rounded-2xl bg-[#272B4A] p-5 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">Transaction History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-slate-600 text-slate-300">
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className="border-b border-slate-700/60 last:border-none">
                <td className="px-3 py-3 text-slate-300">{txn.id}</td>
                <td className="px-3 py-3">{txn.date}</td>
                <td className="px-3 py-3">{txn.description}</td>
                <td className="px-3 py-3">{txn.category}</td>
                <td className={`px-3 py-3 font-semibold ${txn.amount.startsWith("+") ? "text-emerald-300" : "text-rose-300"}`}>
                  {txn.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
