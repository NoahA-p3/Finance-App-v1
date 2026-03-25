import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { formatCurrencyFromCents, getDashboardFinanceData } from "@/lib/dashboard-data";

export default async function TransactionsPage() {
  const { supabase, user } = await requireUser();
  const membership = await getCompanyMembershipContext(supabase, user.id);

  const data = membership
    ? await getDashboardFinanceData(supabase, user.id, membership.companyId)
    : { kpis: [], trendData: [], expenseBreakdown: [], recentTransactions: [] };

  return (
    <DashboardShell title="Transactions">
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input placeholder="Search description or amount..." />
          <select className="rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-100"><option>All categories</option></select>
          <select className="rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-100"><option>All status</option></select>
        </div>
        {data.recentTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-indigo-100/65">No persisted transactions found.</p>
        ) : (
          <table className="w-full text-left text-sm text-indigo-100/90">
            <thead className="text-xs uppercase text-indigo-200/60">
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Receipt</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="py-3">{row.date}</td>
                  <td>{row.description}</td>
                  <td>{formatCurrencyFromCents(row.amountCents)}</td>
                  <td>{row.category}</td>
                  <td>{row.hasReceipt ? "Attached" : "Missing"}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </DashboardShell>
  );
}
