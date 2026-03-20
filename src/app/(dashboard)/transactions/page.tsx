import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { recentTransactions } from "@/lib/mock-data";

export default function TransactionsPage() {
  return (
    <DashboardShell title="Transactions">
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input placeholder="Search merchant or amount..." />
          <select className="rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-100"><option>All categories</option></select>
          <select className="rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-100"><option>All status</option></select>
        </div>
        <table className="w-full text-left text-sm text-indigo-100/90">
          <thead className="text-xs uppercase text-indigo-200/60"><tr><th>Date</th><th>Merchant</th><th>Amount</th><th>Category</th><th>Receipt</th><th>Status</th></tr></thead>
          <tbody>
            {recentTransactions.map((row) => (
              <tr key={row.id} className="border-t border-white/10"><td className="py-3">{row.date}</td><td>{row.merchant}</td><td>${Math.abs(row.amount)}</td><td>{row.category}</td><td>{row.receipt}</td><td>{row.status}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}
