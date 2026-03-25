import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { isEntitlementEnforcementEnabledForPlan } from "@/lib/auth-flags";
import { createClient } from "@/lib/supabase/server";

const ENFORCED_ENTITLEMENTS = {
  MONTHLY_VOUCHERS: "monthly_vouchers",
  ROLLING_TURNOVER_12M_DKK: "rolling_turnover_12m_dkk"
} as const;


function decimalToCents(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0n;

  const normalized = typeof value === "number" ? value.toFixed(2) : String(value).trim();
  const match = normalized.match(/^(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) return 0n;

  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? "").padEnd(2, "0"));
  return whole * 100n + fraction;
}

function centsToDecimalString(cents: bigint) {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, "0");
  return `${whole.toString()}.${fraction}`;
}

export interface EntitlementUsageSnapshot {
  monthlyVoucherCount: number;
  rollingTurnover12mDkk: string;
  period: {
    monthStart: string;
    monthEnd: string;
    rollingStart: string;
    rollingEnd: string;
  };
}

interface PlanEntitlement {
  entitlement_key: string;
  limit_value: string | null;
  warning_threshold_percent: number;
  is_enforced: boolean;
}

export interface CompanyEntitlementsState {
  companyId: string;
  plan: {
    key: string;
    name: string;
    status: string;
  };
  entitlements: PlanEntitlement[];
  usage: EntitlementUsageSnapshot;
}

export async function getCompanyEntitlementsState(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const membership = await getCompanyMembershipContext(supabase, userId);
  if (!membership) return null;

  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("plan_id, status, plans(key, name)")
    .eq("company_id", membership.companyId)
    .in("status", ["active", "trialing"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription || !subscription.plans) return null;

  const planRelation = Array.isArray(subscription.plans) ? subscription.plans[0] : subscription.plans;
  if (!planRelation) return null;

  const plan = planRelation as { key?: string; name?: string };
  const { data: entitlements } = await supabase
    .from("plan_entitlements")
    .select("entitlement_key, limit_value, warning_threshold_percent, is_enforced")
    .eq("plan_id", subscription.plan_id)
    .order("entitlement_key", { ascending: true });

  const usage = await computeUsageSnapshot(supabase, membership.companyId);

  return {
    companyId: membership.companyId,
    plan: {
      key: plan.key ?? "unknown",
      name: plan.name ?? "Unknown",
      status: subscription.status
    },
    entitlements: entitlements ?? [],
    usage
  } satisfies CompanyEntitlementsState;
}

export async function computeUsageSnapshot(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string) {
  const now = new Date();
  const monthStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const rollingStartDate = new Date(now);
  rollingStartDate.setUTCDate(rollingStartDate.getUTCDate() - 365);

  const monthStart = monthStartDate.toISOString().slice(0, 10);
  const monthEnd = monthEndDate.toISOString().slice(0, 10);
  const rollingStart = rollingStartDate.toISOString().slice(0, 10);
  const rollingEnd = now.toISOString().slice(0, 10);

  const { count: voucherCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  const { data: turnoverRows } = await supabase
    .from("transactions")
    .select("amount")
    .eq("company_id", companyId)
    .eq("type", "revenue")
    .gte("date", rollingStart)
    .lte("date", rollingEnd);

  let turnoverCents = 0n;
  for (const row of turnoverRows ?? []) {
    turnoverCents += decimalToCents(row.amount as string | number);
  }

  return {
    monthlyVoucherCount: voucherCount ?? 0,
    rollingTurnover12mDkk: centsToDecimalString(turnoverCents),
    period: {
      monthStart,
      monthEnd,
      rollingStart,
      rollingEnd
    }
  } satisfies EntitlementUsageSnapshot;
}

export async function evaluateTransactionWriteLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  transaction: { type: "expense" | "revenue"; amount: string }
) {
  const state = await getCompanyEntitlementsState(supabase, userId);
  if (!state) {
    return { allow: true as const, warning: null, softLock: null, state: null };
  }

  if (!isEntitlementEnforcementEnabledForPlan(state.plan.key)) {
    return { allow: true as const, warning: null, softLock: null, state };
  }

  const entitlementByKey = new Map(state.entitlements.map((entry) => [entry.entitlement_key, entry]));

  const voucherEntitlement = entitlementByKey.get(ENFORCED_ENTITLEMENTS.MONTHLY_VOUCHERS);
  if (voucherEntitlement?.is_enforced && voucherEntitlement.limit_value !== null) {
    const limit = Number(voucherEntitlement.limit_value);
    const nextCount = state.usage.monthlyVoucherCount + 1;
    if (Number.isFinite(limit) && nextCount > limit) {
      return {
        allow: false as const,
        warning: null,
        state,
        softLock: {
          code: "monthly_voucher_limit_reached",
          message: "Monthly voucher limit reached for your current plan. Upgrade to continue creating entries.",
          metric: ENFORCED_ENTITLEMENTS.MONTHLY_VOUCHERS,
          limit: voucherEntitlement.limit_value,
          current: String(state.usage.monthlyVoucherCount)
        }
      };
    }

    const threshold = Math.ceil((limit * voucherEntitlement.warning_threshold_percent) / 100);
    if (Number.isFinite(limit) && nextCount >= threshold) {
      return {
        allow: true as const,
        state,
        softLock: null,
        warning: {
          code: "monthly_voucher_limit_near",
          metric: ENFORCED_ENTITLEMENTS.MONTHLY_VOUCHERS,
          message: `You are close to your monthly voucher limit (${nextCount}/${limit}).`,
          limit: voucherEntitlement.limit_value,
          current: String(nextCount)
        }
      };
    }
  }

  const turnoverEntitlement = entitlementByKey.get(ENFORCED_ENTITLEMENTS.ROLLING_TURNOVER_12M_DKK);
  if (transaction.type === "revenue" && turnoverEntitlement?.is_enforced && turnoverEntitlement.limit_value !== null) {
    const currentCents = decimalToCents(state.usage.rollingTurnover12mDkk);
    const addCents = decimalToCents(transaction.amount);
    const nextCents = currentCents + addCents;
    const limitCents = decimalToCents(turnoverEntitlement.limit_value);

    if (nextCents > limitCents) {
      return {
        allow: false as const,
        warning: null,
        state,
        softLock: {
          code: "rolling_turnover_cap_reached",
          message: "Rolling turnover cap reached for your current plan. Upgrade to continue recording revenue.",
          metric: ENFORCED_ENTITLEMENTS.ROLLING_TURNOVER_12M_DKK,
          limit: turnoverEntitlement.limit_value,
          current: centsToDecimalString(currentCents)
        }
      };
    }

    const thresholdCents = (limitCents * BigInt(turnoverEntitlement.warning_threshold_percent)) / 100n;
    if (nextCents >= thresholdCents) {
      return {
        allow: true as const,
        state,
        softLock: null,
        warning: {
          code: "rolling_turnover_cap_near",
          metric: ENFORCED_ENTITLEMENTS.ROLLING_TURNOVER_12M_DKK,
          message: "You are close to your rolling turnover cap.",
          limit: turnoverEntitlement.limit_value,
          current: centsToDecimalString(nextCents)
        }
      };
    }
  }

  return { allow: true as const, warning: null, softLock: null, state };
}

export async function upsertUsageCounters(supabase: Awaited<ReturnType<typeof createClient>>, state: CompanyEntitlementsState) {
  const rows = [
    {
      company_id: state.companyId,
      entitlement_key: ENFORCED_ENTITLEMENTS.MONTHLY_VOUCHERS,
      period_start: state.usage.period.monthStart,
      period_end: state.usage.period.monthEnd,
      usage_value: state.usage.monthlyVoucherCount,
      metadata: { unit: "count" }
    },
    {
      company_id: state.companyId,
      entitlement_key: ENFORCED_ENTITLEMENTS.ROLLING_TURNOVER_12M_DKK,
      period_start: state.usage.period.rollingStart,
      period_end: state.usage.period.rollingEnd,
      usage_value: state.usage.rollingTurnover12mDkk,
      metadata: { unit: "dkk" }
    }
  ];

  await supabase
    .from("usage_counters")
    .upsert(rows, { onConflict: "company_id,entitlement_key,period_start,period_end", ignoreDuplicates: false });
}
