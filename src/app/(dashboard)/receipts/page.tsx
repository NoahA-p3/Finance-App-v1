import { DashboardShell } from "@/components/shell/dashboard-shell";
import { NoCompanyState } from "@/components/shell/no-company-state";
import { requireUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { ReceiptInboxClient } from "@/components/receipts/receipt-inbox-client";

export default async function ReceiptsPage() {
  const { supabase, user } = await requireUser();
  const membership = await getCompanyMembershipContext(supabase, user.id);

  return (
    <DashboardShell title="Receipts">
      {!membership ? <NoCompanyState /> : null}
      <ReceiptInboxClient />
    </DashboardShell>
  );
}
