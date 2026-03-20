import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Card } from "@/components/ui/card";

const receipts = [
  { merchant: "AWS", date: "2026-03-16", amount: 240, linked: "t1" },
  { merchant: "Notion", date: "2026-03-14", amount: 16, linked: "t4" },
  { merchant: "Uber", date: "2026-03-12", amount: 41, linked: "t7" }
];

export default function ReceiptsPage() {
  return (
    <DashboardShell title="Receipts">
      <Card>
        <div className="rounded-2xl border-2 border-dashed border-white/20 bg-[#171a36] p-8 text-center text-sm text-indigo-200/70">Drag and drop receipt files (images or PDF) here.</div>
      </Card>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {receipts.map((receipt) => (
          <Card key={`${receipt.merchant}-${receipt.date}`}>
            <p className="font-semibold text-white">{receipt.merchant}</p>
            <p className="mt-2 text-sm text-indigo-200/70">{receipt.date}</p>
            <p className="text-sm text-indigo-100">${receipt.amount}</p>
            <p className="mt-2 text-xs text-cyan-300">Linked transaction: {receipt.linked}</p>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
