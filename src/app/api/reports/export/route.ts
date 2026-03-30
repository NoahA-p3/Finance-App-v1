import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { aggregateTransactionTypeTotals, amountToCents } from "@/lib/dashboard-data";
import { centsBigIntToDecimalString } from "@/lib/finance-decimals";
import { normalizeCurrencyCode } from "@/lib/money-format";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const OUTPUT_FORMATS = new Set(["json", "csv"] as const);
type OutputFormat = "json" | "csv";

interface ExportRequestPayload {
  date_from?: unknown;
  date_to?: unknown;
  format?: unknown;
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

function parsePayload(payload: ExportRequestPayload | null) {
  const dateFrom = typeof payload?.date_from === "string" ? payload.date_from.trim() : "";
  const dateTo = typeof payload?.date_to === "string" ? payload.date_to.trim() : "";
  const format = typeof payload?.format === "string" ? payload.format.trim().toLowerCase() : "";

  if (!isValidIsoDate(dateFrom) || !isValidIsoDate(dateTo)) {
    return { error: "date_from and date_to must be valid ISO dates in YYYY-MM-DD format." } as const;
  }

  if (dateFrom > dateTo) {
    return { error: "date_from must be less than or equal to date_to." } as const;
  }

  if (!OUTPUT_FORMATS.has(format as OutputFormat)) {
    return { error: "format must be either 'json' or 'csv'." } as const;
  }

  return {
    value: {
      dateFrom,
      dateTo,
      format: format as OutputFormat
    }
  } as const;
}

function toCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  const payload = (await req.json().catch(() => null)) as ExportRequestPayload | null;
  const parsedPayload = parsePayload(payload);

  if (!parsedPayload.value) {
    return NextResponse.json({ error: parsedPayload.error }, { status: 400 });
  }

  const { dateFrom, dateTo, format } = parsedPayload.value;

  const [{ data: transactions, error: transactionsError }, { data: categories }, { data: settings }] = await Promise.all([
    authContext.supabase
      .from("transactions")
      .select("id, date, description, type, amount, category_id")
      .eq("company_id", membership.companyId)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: true })
      .order("id", { ascending: true }),
    authContext.supabase.from("categories").select("id, name").eq("company_id", membership.companyId),
    authContext.supabase.from("company_settings").select("base_currency").eq("company_id", membership.companyId).maybeSingle()
  ]);

  if (transactionsError) {
    return NextResponse.json({ error: transactionsError.message }, { status: 400 });
  }

  const rows = transactions ?? [];
  const categoryNameById = new Map((categories ?? []).map((entry) => [entry.id, entry.name]));
  const totals = aggregateTransactionTypeTotals(rows);
  const currency = normalizeCurrencyCode(settings?.base_currency);

  const exportedTransactions = rows.map((row) => ({
    id: row.id,
    date: row.date,
    description: row.description,
    type: row.type,
    category: row.category_id ? categoryNameById.get(row.category_id) ?? "Uncategorized" : "Uncategorized",
    amount_decimal: centsBigIntToDecimalString(amountToCents(row.amount))
  }));

  if (format === "csv") {
    const csvLines = [
      "id,date,description,type,category,amount_decimal",
      ...exportedTransactions.map((row) =>
        [row.id, row.date, row.description, row.type, row.category, row.amount_decimal].map(toCsvCell).join(",")
      )
    ];

    const csvBody = csvLines.join("\n");
    return new NextResponse(csvBody, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "x-report-company-id": membership.companyId,
        "x-report-date-from": dateFrom,
        "x-report-date-to": dateTo
      }
    });
  }

  return NextResponse.json({
    scope: {
      company_id: membership.companyId,
      date_from: dateFrom,
      date_to: dateTo
    },
    output: {
      format: "json",
      currency_code: currency
    },
    summary: {
      totals: {
        revenue_decimal: centsBigIntToDecimalString(totals.revenueCents),
        expenses_decimal: centsBigIntToDecimalString(totals.expenseCents),
        profit_decimal: centsBigIntToDecimalString(totals.profitCents)
      },
      transaction_count: exportedTransactions.length
    },
    transactions: exportedTransactions
  });
}
