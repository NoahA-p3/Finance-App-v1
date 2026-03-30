import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface LinkBody {
  transaction_id: string;
}

function parseBody(payload: unknown): { value?: LinkBody; error?: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." };
  }

  const raw = payload as Record<string, unknown>;
  const unknownKeys = Object.keys(raw).filter((key) => key !== "transaction_id");
  if (unknownKeys.length > 0) {
    return { error: `Unsupported field(s): ${unknownKeys.join(", ")}.` };
  }

  if (typeof raw.transaction_id !== "string" || !UUID_PATTERN.test(raw.transaction_id)) {
    return { error: "transaction_id must be a UUID string." };
  }

  return { value: { transaction_id: raw.transaction_id } };
}

export async function POST(req: NextRequest, context: RouteContext) {
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

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseBody(payload);
  if (!parsed.value) {
    return NextResponse.json({ error: parsed.error ?? "Invalid request body." }, { status: 400 });
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

  const { data: transaction } = await authContext.supabase
    .from("transactions")
    .select("id,description,amount,type,date,receipt_id")
    .eq("id", parsed.value.transaction_id)
    .eq("company_id", membership.companyId)
    .maybeSingle();

  if (!transaction) {
    return NextResponse.json({ error: "transaction_id does not exist in active company context." }, { status: 400 });
  }

  if (receipt.transaction_id && receipt.transaction_id !== transaction.id) {
    await authContext.supabase
      .from("transactions")
      .update({ receipt_id: null })
      .eq("id", receipt.transaction_id)
      .eq("company_id", membership.companyId);
  }

  if (transaction.receipt_id && transaction.receipt_id !== receipt.id) {
    await authContext.supabase
      .from("receipts")
      .update({ transaction_id: null })
      .eq("id", transaction.receipt_id)
      .eq("company_id", membership.companyId);
  }

  const { data: updatedReceipt, error: receiptUpdateError } = await authContext.supabase
    .from("receipts")
    .update({ transaction_id: transaction.id })
    .eq("id", receipt.id)
    .eq("company_id", membership.companyId)
    .select("id,path,created_at,transaction_id")
    .single();

  if (receiptUpdateError) {
    return NextResponse.json({ error: receiptUpdateError.message }, { status: 400 });
  }

  const { data: updatedTransaction, error: transactionUpdateError } = await authContext.supabase
    .from("transactions")
    .update({ receipt_id: receipt.id })
    .eq("id", transaction.id)
    .eq("company_id", membership.companyId)
    .select("id,description,amount,type,date,receipt_id")
    .single();

  if (transactionUpdateError) {
    return NextResponse.json({ error: transactionUpdateError.message }, { status: 400 });
  }

  return NextResponse.json({
    receipt: updatedReceipt,
    transaction: updatedTransaction
  });
}
