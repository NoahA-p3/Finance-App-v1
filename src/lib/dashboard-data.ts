import type { Database } from "@/types/database";
import type { createClient } from "@/lib/supabase/server";

export interface DashboardKpi {
  title: string;
  amountCents: bigint;
  delta: string;
}

export interface TrendPoint {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ExpenseSlice {
  name: string;
  value: number;
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
  const normalized = String(amount).trim();
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [wholePart, decimalPartRaw = ""] = unsigned.split(".");
  const decimalPart = decimalPartRaw.padEnd(2, "0").slice(0, 2);
  const cents = BigInt((wholePart || "0") + decimalPart);
  return negative ? -cents : cents;
}

function centsToNumber(cents: bigint): number {
  return Number(cents) / 100;
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

export function formatCurrencyFromCents(cents: bigint, currencyCode?: string | null) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: normalizeCurrencyCode(currencyCode) }).format(centsToNumber(cents));
}

export async function getDashboardFinanceData(supabase: SupabaseClient, userId: string, companyId: string): Promise<DashboardFinanceData> {
  const [{ data: transactions }, { data: categories }, { data: settings }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, amount, date, description, type, category_id, receipt_id")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .order("date", { ascending: false })
      .limit(500),
    supabase.from("categories").select("id, name").eq("user_id", userId).eq("company_id", companyId),
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
      revenue: centsToNumber(bucket.revenue),
      expenses: centsToNumber(bucket.expenses),
      profit: centsToNumber(bucket.revenue - bucket.expenses)
    };
  });

  const expenseByCategory = new Map<string, bigint>();
  for (const row of transactionRows) {
    if (row.type !== "expense") continue;
    const category = row.category_id ? categoryNameById.get(row.category_id) : null;
    const key = category ?? "Uncategorized";
    expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0n) + amountToCents(row.amount));
  }

  const totalExpenses = Array.from(expenseByCategory.values()).reduce((sum, value) => sum + value, 0n);
  const expenseBreakdown: ExpenseSlice[] = Array.from(expenseByCategory.entries())
    .sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1))
    .slice(0, 6)
    .map(([name, amount]) => ({
      name,
      value: totalExpenses === 0n ? 0 : Number((amount * 100n) / totalExpenses)
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
