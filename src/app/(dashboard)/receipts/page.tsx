import { DashboardShell } from "@/components/shell/dashboard-shell";
import { ReceiptInboxClient } from "@/components/receipts/receipt-inbox-client";

export default function ReceiptsPage() {
  return (
    <DashboardShell title="Receipts">
      <ReceiptInboxClient />
    </DashboardShell>
  );
}
