import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/lib/data";
import { CategoryManager } from "@/components/transactions/category-manager";
import { ReceiptUpload } from "@/components/transactions/receipt-upload";
import { TransactionList } from "@/components/transactions/transaction-list";

export default async function TransactionsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const [transactions, categoriesResult] = await Promise.all([
    getTransactions(user.id),
    supabase.from("categories").select("id,name").eq("user_id", user.id).order("created_at", { ascending: false })
  ]);

  return (
    <div className="space-y-6">
      <TransactionList transactions={transactions as never[]} />
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryManager initialCategories={categoriesResult.data ?? []} />
        <ReceiptUpload />
      </div>
      <p className="text-sm text-slate-500">Receipt matching can be automated with bank sync + OCR in a later release.</p>
    </div>
  );
}
