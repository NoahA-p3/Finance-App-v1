import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface TransactionPatchInput {
  category_id?: string | null;
  receipt_id?: string | null;
  notes?: string | null;
}

function parseOptionalUuid(fieldName: "category_id" | "receipt_id", value: unknown) {
  if (value === undefined) {
    return { value: undefined } as const;
  }

  if (value === null) {
    return { value: null } as const;
  }

  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    return { error: `${fieldName} must be a UUID string or null.` } as const;
  }

  return { value } as const;
}

function parseNotes(value: unknown) {
  if (value === undefined) {
    return { value: undefined } as const;
  }

  if (value === null) {
    return { value: null } as const;
  }

  if (typeof value !== "string") {
    return { error: "notes must be a string or null." } as const;
  }

  const normalized = value.trim();
  if (normalized.length > 2000) {
    return { error: "notes must be at most 2000 characters." } as const;
  }

  return { value: normalized || null } as const;
}

function parsePatchBody(payload: unknown): { value?: TransactionPatchInput; error?: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." };
  }

  const raw = payload as Record<string, unknown>;
  const allowed = new Set(["category_id", "receipt_id", "notes"]);
  const unknownKeys = Object.keys(raw).filter((key) => !allowed.has(key));

  if (unknownKeys.length > 0) {
    return { error: `Unsupported field(s): ${unknownKeys.join(", ")}.` };
  }

  if (Object.keys(raw).length === 0) {
    return { error: "At least one of category_id, receipt_id, or notes is required." };
  }

  const categoryIdResult = parseOptionalUuid("category_id", raw.category_id);
  if ("error" in categoryIdResult) {
    return { error: categoryIdResult.error };
  }

  const receiptIdResult = parseOptionalUuid("receipt_id", raw.receipt_id);
  if ("error" in receiptIdResult) {
    return { error: receiptIdResult.error };
  }

  const notesResult = parseNotes(raw.notes);
  if ("error" in notesResult) {
    return { error: notesResult.error };
  }

  return {
    value: {
      category_id: categoryIdResult.value,
      receipt_id: receiptIdResult.value,
      notes: notesResult.value
    }
  };
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_TRANSACTIONS_WRITE)) {
    return NextResponse.json({ error: "Missing required permission: finance.transactions.write" }, { status: 403 });
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

  const parsed = parsePatchBody(payload);
  if (!parsed.value) {
    return NextResponse.json({ error: parsed.error ?? "Invalid request body." }, { status: 400 });
  }

  const { data: existingTransaction } = await authContext.supabase
    .from("transactions")
    .select("id")
    .eq("id", id)
    .eq("company_id", membership.companyId)
    .maybeSingle();

  if (!existingTransaction) {
    return NextResponse.json({ error: "Transaction not found in active company context." }, { status: 404 });
  }

  if (parsed.value.category_id) {
    const { data: category } = await authContext.supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.value.category_id)
      .eq("company_id", membership.companyId)
      .maybeSingle();

    if (!category) {
      return NextResponse.json({ error: "category_id does not exist in active company context." }, { status: 400 });
    }
  }

  if (parsed.value.receipt_id) {
    const { data: receipt } = await authContext.supabase
      .from("receipts")
      .select("id")
      .eq("id", parsed.value.receipt_id)
      .eq("company_id", membership.companyId)
      .maybeSingle();

    if (!receipt) {
      return NextResponse.json({ error: "receipt_id does not exist in active company context." }, { status: 400 });
    }
  }

  const updatePayload: TransactionPatchInput = {};

  if (parsed.value.category_id !== undefined) {
    updatePayload.category_id = parsed.value.category_id;
  }

  if (parsed.value.receipt_id !== undefined) {
    updatePayload.receipt_id = parsed.value.receipt_id;
  }

  if (parsed.value.notes !== undefined) {
    updatePayload.notes = parsed.value.notes;
  }

  const { data, error } = await authContext.supabase
    .from("transactions")
    .update(updatePayload)
    .eq("id", id)
    .eq("company_id", membership.companyId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
