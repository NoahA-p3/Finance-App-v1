/**
 * TransactionHistoryTable renders transaction history rows when data is available.
 */
const transactions: Array<{ id: string; date: string; description: string; category: string; amount: string }> = [];

export default function TransactionHistoryTable() {
  return (
    <section className="rounded-2xl bg-[#272B4A] p-5 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">Transaction History</h3>
      {transactions.length === 0 ? (
        <p className="text-sm text-slate-300">No transaction rows available yet.</p>
      ) : (
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
                  <td className={`px-3 py-3 font-semibold ${txn.amount.startsWith("+") ? "text-emerald-300" : "text-rose-300"}`}>{txn.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
