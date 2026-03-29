import type { Database } from "@/types/database";
import type { createClient } from "@/lib/supabase/server";
import { decimalStringToCentsBigInt } from "@/lib/finance-decimals";

export type CentsString = `${bigint}`;

export interface DashboardKpi {
  title: string;
  amountCents: bigint;
  delta: string;
}

export interface TrendPoint {
  label: string;
  revenueCents: CentsString;
  expensesCents: CentsString;
  profitCents: CentsString;
}

export interface ExpenseSlice {
  name: string;
  amountCents: CentsString;
}

export interface RecentTransactionRow {
  id: string;
  date: string;
  description: string;
  amountCents: bigint;
  category: string;
  hasReceipt: boolean;
  status: string;
  type: "expense" | "revenue";
}

export interface DashboardFinanceData {
  currencyCode: string;
  kpis: DashboardKpi[];
  trendData: TrendPoint[];
  expenseBreakdown: ExpenseSlice[];
  recentTransactions: RecentTransactionRow[];
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

type TransactionForDashboard = Pick<TransactionRow, "id" | "amount" | "date" | "description" | "type" | "category_id" | "receipt_id">;

function amountToCents(amount: number | string): bigint {
  return decimalStringToCentsBigInt(String(amount));
}

function centsToString(cents: bigint): CentsString {
  return cents.toString() as CentsString;
}

interface CentsParts {
  sign: "" | "-";
  whole: string;
  fraction: string;
}

function splitCentsParts(cents: bigint): CentsParts {
  const sign: "" | "-" = cents < 0n ? "-" : "";
  const absolute = cents < 0n ? -cents : cents;
  const whole = (absolute / 100n).toString();
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return {
    sign,
    whole,
    fraction
  };
}

function addGroupingSeparators(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
}

function normalizeCurrencyCode(currencyCode?: string | null) {
  const normalized = currencyCode?.trim().toUpperCase();
  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : "DKK";
}

export function formatCurrencyFromCents(cents: bigint | CentsString, currencyCode?: string | null) {
  const centsBigInt = typeof cents === "bigint" ? cents : BigInt(cents);
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: normalizeCurrencyCode(currencyCode) });
  const parts = splitCentsParts(centsBigInt);
  const template = formatter.formatToParts(0);
  const firstNumericPart = template.findIndex((part) => part.type === "integer");
  let lastNumericPart = -1;
  for (let index = template.length - 1; index >= 0; index -= 1) {
    if (template[index].type === "fraction") {
      lastNumericPart = index;
      break;
    }
  }

  if (firstNumericPart === -1 || lastNumericPart === -1) {
    return formatter.format(0);
  }

  const decimalSeparator = template.find((part) => part.type === "decimal")?.value ?? ".";
  const prefix = template.slice(0, firstNumericPart).map((part) => part.value).join("");
  const suffix = template
    .slice(lastNumericPart + 1)
    .map((part) => part.value)
    .join("");

  return `${parts.sign}${prefix}${addGroupingSeparators(parts.whole)}${decimalSeparator}${parts.fraction}${suffix}`;
}

export async function getDashboardFinanceData(supabase: SupabaseClient, _userId: string, companyId: string): Promise<DashboardFinanceData> {
  const [{ data: transactions }, { data: categories }, { data: settings }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, amount, date, description, type, category_id, receipt_id")
      .eq("company_id", companyId)
      .order("date", { ascending: false })
      .limit(500),
    supabase.from("categories").select("id, name").eq("company_id", companyId),
    supabase.from("company_settings").select("base_currency").eq("company_id", companyId).maybeSingle()
  ]);

  const transactionRows: TransactionForDashboard[] = transactions ?? [];
  const categoryNameById = new Map((categories ?? []).map((entry) => [entry.id, entry.name]));

  let revenueCents = 0n;
  let expenseCents = 0n;

  for (const row of transactionRows) {
    const cents = amountToCents(row.amount);
    if (row.type === "revenue") {
      revenueCents += cents;
    } else {
      expenseCents += cents;
    }
  }

  const now = new Date();
  const monthDates = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    return date;
  });

  const trendByMonth = new Map(monthDates.map((date) => [monthKey(date), { revenue: 0n, expenses: 0n }]));

  for (const row of transactionRows) {
    const key = row.date.slice(0, 7);
    const bucket = trendByMonth.get(key);
    if (!bucket) continue;

    const cents = amountToCents(row.amount);
    if (row.type === "revenue") {
      bucket.revenue += cents;
    } else {
      bucket.expenses += cents;
    }
  }

  const trendData: TrendPoint[] = monthDates.map((date) => {
    const key = monthKey(date);
    const bucket = trendByMonth.get(key) ?? { revenue: 0n, expenses: 0n };
    return {
      label: monthLabel(date),
      revenueCents: centsToString(bucket.revenue),
      expensesCents: centsToString(bucket.expenses),
      profitCents: centsToString(bucket.revenue - bucket.expenses)
    };
  });

  const expenseByCategory = new Map<string, bigint>();
  for (const row of transactionRows) {
    if (row.type !== "expense") continue;
    const category = row.category_id ? categoryNameById.get(row.category_id) : null;
    const key = category ?? "Uncategorized";
    expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0n) + amountToCents(row.amount));
  }

  const expenseBreakdown: ExpenseSlice[] = Array.from(expenseByCategory.entries())
    .sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1))
    .slice(0, 6)
    .map(([name, amount]) => ({
      name,
      amountCents: centsToString(amount)
    }));

  const recentTransactions: RecentTransactionRow[] = transactionRows.slice(0, 12).map((row) => ({
    id: row.id,
    date: row.date,
    description: row.description,
    amountCents: amountToCents(row.amount),
    category: row.category_id ? categoryNameById.get(row.category_id) ?? "Uncategorized" : "Uncategorized",
    hasReceipt: Boolean(row.receipt_id),
    status: row.receipt_id ? "Receipt linked" : "Needs receipt",
    type: row.type
  }));

  return {
    currencyCode: normalizeCurrencyCode(settings?.base_currency),
    kpis: [
      { title: "Revenue", amountCents: revenueCents, delta: "Based on persisted transactions" },
      { title: "Expenses", amountCents: expenseCents, delta: "Based on persisted transactions" },
      { title: "Net Profit", amountCents: revenueCents - expenseCents, delta: "Revenue minus expenses" }
    ],
    trendData,
    expenseBreakdown,
    recentTransactions
  };
}
