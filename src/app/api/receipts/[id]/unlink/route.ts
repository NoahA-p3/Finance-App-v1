import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_: Request, context: RouteContext) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_RECEIPTS_WRITE)) {
    return NextResponse.json({ error: "Missing required permission: finance.receipts.write" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "id must be a UUID string." }, { status: 400 });
  }

  const { data: receipt } = await authContext.supabase
    .from("receipts")
    .select("id,path,created_at,transaction_id")
    .eq("id", id)
    .eq("company_id", membership.companyId)
    .maybeSingle();

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found in active company context." }, { status: 404 });
  }

  let updatedTransaction: {
    id: string;
    description: string;
    amount: string | number;
    type: "expense" | "revenue";
    date: string;
    receipt_id: string | null;
  } | null = null;

  if (receipt.transaction_id) {
    const { data: transaction } = await authContext.supabase
      .from("transactions")
      .update({ receipt_id: null })
      .eq("id", receipt.transaction_id)
      .eq("company_id", membership.companyId)
      .select("id,description,amount,type,date,receipt_id")
      .maybeSingle();

    if (transaction) {
      updatedTransaction = transaction;
    }
  }

  const { data: updatedReceipt, error: receiptUpdateError } = await authContext.supabase
    .from("receipts")
    .update({ transaction_id: null })
    .eq("id", receipt.id)
    .eq("company_id", membership.companyId)
    .select("id,path,created_at,transaction_id")
    .single();

  if (receiptUpdateError) {
    return NextResponse.json({ error: receiptUpdateError.message }, { status: 400 });
  }

  return NextResponse.json({
    receipt: updatedReceipt,
    transaction: updatedTransaction
  });
}
