import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";
import { evaluateTransactionWriteLimit, getCompanyEntitlementsState, upsertUsageCounters } from "@/lib/entitlements";

const TRANSACTION_TYPES = new Set(["expense", "revenue"] as const);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL_2DP_PATTERN = /^\d+(\.\d{1,2})?$/;

interface ValidTransactionInput {
  description: string;
  amount: string;
  type: "expense" | "revenue";
  date: string;
  category_id?: string | null;
  receipt_id?: string | null;
}

function isValidIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return parsedDate.toISOString().slice(0, 10) === value;
}

function parseAmount(value: unknown) {
  const normalized = typeof value === "number" ? value.toString() : typeof value === "string" ? value.trim() : null;

  if (!normalized || !DECIMAL_2DP_PATTERN.test(normalized)) {
    return { error: "Amount must be a non-negative number with up to 2 decimal places." } as const;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: "Amount must be a non-negative number." } as const;
  }

  const [whole, decimal = ""] = normalized.split(".");
  return { value: `${whole}.${decimal.padEnd(2, "0")}` } as const;
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

function validateTransactionInput(payload: unknown): { value?: ValidTransactionInput; error?: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." };
  }

  const raw = payload as Record<string, unknown>;

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (!description) {
    return { error: "description is required." };
  }

  const amountResult = parseAmount(raw.amount);
  if ("error" in amountResult) {
    return { error: amountResult.error };
  }

  const type = raw.type;
  if (typeof type !== "string" || !TRANSACTION_TYPES.has(type as "expense" | "revenue")) {
    return { error: "type must be either 'expense' or 'revenue'." };
  }

  const date = typeof raw.date === "string" ? raw.date.trim() : "";
  if (!isValidIsoDate(date)) {
    return { error: "date must be a valid ISO date in YYYY-MM-DD format." };
  }

  const categoryIdResult = parseOptionalUuid("category_id", raw.category_id);
  if ("error" in categoryIdResult) {
    return { error: categoryIdResult.error };
  }

  const receiptIdResult = parseOptionalUuid("receipt_id", raw.receipt_id);
  if ("error" in receiptIdResult) {
    return { error: receiptIdResult.error };
  }

  return {
    value: {
      description,
      amount: amountResult.value,
      type: type as "expense" | "revenue",
      date,
      category_id: categoryIdResult.value,
      receipt_id: receiptIdResult.value
    }
  };
}

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  const { data, error } = await authContext.supabase
    .from("transactions")
    .select("*")
    .eq("company_id", membership.companyId)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_TRANSACTIONS_WRITE)) {
    return NextResponse.json({ error: "Missing required permission: finance.transactions.write" }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateTransactionInput(payload);

  if (!validation.value) {
    return NextResponse.json({ error: validation.error ?? "Invalid request body." }, { status: 400 });
  }

  if (validation.value.category_id) {
    const { data: category } = await authContext.supabase
      .from("categories")
      .select("id")
      .eq("id", validation.value.category_id)
      .eq("company_id", membership.companyId)
      .maybeSingle();

    if (!category) {
      return NextResponse.json({ error: "category_id does not exist in active company context." }, { status: 400 });
    }
  }

  if (validation.value.receipt_id) {
    const { data: receipt } = await authContext.supabase
      .from("receipts")
      .select("id")
      .eq("id", validation.value.receipt_id)
      .eq("company_id", membership.companyId)
      .maybeSingle();

    if (!receipt) {
      return NextResponse.json({ error: "receipt_id does not exist in active company context." }, { status: 400 });
    }
  }

  const entitlementDecision = await evaluateTransactionWriteLimit(authContext.supabase, authContext.user.id, {
    type: validation.value.type,
    amount: validation.value.amount
  });

  if (!entitlementDecision.allow) {
    return NextResponse.json(
      {
        error: entitlementDecision.softLock?.message ?? "Plan limit reached.",
        soft_lock: entitlementDecision.softLock,
        upgrade_prompt: {
          title: "Upgrade required",
          body: "Your current plan limit is reached. Upgrade to continue.",
          cta_label: "View plans"
        }
      },
      { status: 429 }
    );
  }

  const insertPayload = {
    description: validation.value.description,
    amount: validation.value.amount,
    type: validation.value.type,
    date: validation.value.date,
    category_id: validation.value.category_id,
    receipt_id: validation.value.receipt_id,
    user_id: authContext.user.id,
    company_id: membership.companyId
  };

  const { data, error } = await authContext.supabase.from("transactions").insert(insertPayload).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const refreshedState = await getCompanyEntitlementsState(authContext.supabase, authContext.user.id);
  if (refreshedState) {
    await upsertUsageCounters(authContext.supabase, refreshedState);
  }

  return NextResponse.json(
    {
      ...data,
      entitlement_warning: entitlementDecision.warning,
      upgrade_prompt: entitlementDecision.warning
        ? {
            title: "Approaching plan limit",
            body: entitlementDecision.warning.message,
            cta_label: "Compare plans"
          }
        : null
    },
    { status: 201 }
  );
}
