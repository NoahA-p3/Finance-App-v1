import crypto from "node:crypto";
import type { createClient } from "@/lib/supabase/server";

const DECIMAL_TWO_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const DECIMAL_SIX_PATTERN = /^\d+(?:\.\d{1,6})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const RATE_SCALE = 1_000_000n;
const CENTS_SCALE = 100n;

export const VAT_REVIEW_BASELINE_ENGINE_VERSION = "vat-rvw-001-baseline";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PreviewTransactionRow = {
  id: string;
  amount: number | string;
  type: "expense" | "revenue";
  date: string;
};

type VatCodeRow = {
  id: string;
  company_id: string | null;
  code: string;
  description: string;
  rate_decimal: number | string;
  direction: "input" | "output";
  created_at: string;
};

interface EffectiveVatCode {
  code: string;
  description: string;
  rateDecimal: string;
  ratePpm: bigint;
  sourceScope: "company_override" | "global_default";
}

interface PublicVatCodeExplainability {
  code: string;
  description: string;
  rateDecimal: string;
  sourceScope: "company_override" | "global_default";
}

export interface VatReviewPreviewRequest {
  periodStart: string;
  periodEnd: string;
  engineVersion?: string;
}

export interface VatReviewPreviewResult {
  company_id: string;
  period_start: string;
  period_end: string;
  engine_version: string;
  input_hash: string;
  totals: {
    output_vat_total: string;
    input_vat_total: string;
    net_vat_decimal: string;
  };
  explainability: {
    assumptions: string[];
    legal_form_behavior: "TODO";
    taxable_base_provenance: "transactions.amount treated as VAT-inclusive gross amount";
    rate_sources: {
      input: PublicVatCodeExplainability;
      output: PublicVatCodeExplainability;
    };
    lines: Array<{
      transaction_id: string;
      transaction_type: "expense" | "revenue";
      transaction_date: string;
      gross_amount_decimal: string;
      vat_code: string;
      vat_rate_decimal: string;
      vat_rate_source_scope: EffectiveVatCode["sourceScope"];
      taxable_base_decimal: string;
      vat_amount_decimal: string;
    }>;
  };
}

function isIsoDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseMoneyToCents(value: string): bigint {
  const normalized = value.trim();
  if (!DECIMAL_TWO_PATTERN.test(normalized)) {
    throw new Error(`Invalid decimal money value: ${value}`);
  }

  const [wholeRaw, fractionRaw = ""] = normalized.split(".");
  const whole = BigInt(wholeRaw);
  const fraction = BigInt((fractionRaw + "00").slice(0, 2));

  return whole * CENTS_SCALE + fraction;
}

function parseRateToPpm(value: string): bigint {
  const normalized = value.trim();
  if (!DECIMAL_SIX_PATTERN.test(normalized)) {
    throw new Error(`Invalid VAT rate decimal: ${value}`);
  }

  const [wholeRaw, fractionRaw = ""] = normalized.split(".");
  const whole = BigInt(wholeRaw);
  const fraction = BigInt((fractionRaw + "000000").slice(0, 6));

  return whole * RATE_SCALE + fraction;
}

function centsToDecimal(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const absValue = value < 0n ? -value : value;
  const whole = absValue / CENTS_SCALE;
  const fraction = absValue % CENTS_SCALE;
  return `${sign}${whole.toString()}.${fraction.toString().padStart(2, "0")}`;
}

function roundDivision(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

function computeVatFromGross(grossCents: bigint, ratePpm: bigint): bigint {
  if (grossCents <= 0n || ratePpm <= 0n) return 0n;

  const numerator = grossCents * ratePpm;
  const denominator = RATE_SCALE + ratePpm;
  return roundDivision(numerator, denominator);
}

function chooseEffectiveCode(rows: VatCodeRow[], direction: "input" | "output"): EffectiveVatCode {
  const candidates = rows
    .filter((row) => row.direction === direction)
    .sort((a, b) => {
      if (a.company_id && !b.company_id) return -1;
      if (!a.company_id && b.company_id) return 1;
      if (a.code !== b.code) return a.code.localeCompare(b.code);
      return a.created_at.localeCompare(b.created_at);
    });

  const selected = candidates[0];
  if (!selected) {
    throw new Error(`Missing active ${direction} VAT code for preview baseline.`);
  }

  const rateDecimal = String(selected.rate_decimal);
  return {
    code: selected.code,
    description: selected.description,
    rateDecimal,
    ratePpm: parseRateToPpm(rateDecimal),
    sourceScope: selected.company_id ? "company_override" : "global_default"
  };
}

function toPublicVatCodeExplainability(code: EffectiveVatCode): PublicVatCodeExplainability {
  return {
    code: code.code,
    description: code.description,
    rateDecimal: code.rateDecimal,
    sourceScope: code.sourceScope
  };
}

function normalizeEngineVersion(value: string | undefined): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : VAT_REVIEW_BASELINE_ENGINE_VERSION;
}

export async function previewVatReview(
  supabase: SupabaseServerClient,
  companyId: string,
  input: VatReviewPreviewRequest
): Promise<VatReviewPreviewResult> {
  if (!isIsoDate(input.periodStart) || !isIsoDate(input.periodEnd)) {
    throw new Error("period_start and period_end must be ISO date strings (YYYY-MM-DD).");
  }

  if (input.periodStart > input.periodEnd) {
    throw new Error("period_start must be less than or equal to period_end.");
  }

  const engineVersion = normalizeEngineVersion(input.engineVersion);

  const [{ data: transactions, error: transactionsError }, { data: vatCodes, error: vatCodesError }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, amount, type, date")
      .eq("company_id", companyId)
      .gte("date", input.periodStart)
      .lte("date", input.periodEnd)
      .order("date", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("vat_codes")
      .select("id, company_id, code, description, rate_decimal, direction, created_at")
      .eq("is_active", true)
      .or(`company_id.is.null,company_id.eq.${companyId}`)
  ]);

  if (transactionsError) {
    throw new Error(`Failed to load transactions for VAT preview: ${transactionsError.message}`);
  }

  if (vatCodesError) {
    throw new Error(`Failed to load VAT codes for preview: ${vatCodesError.message}`);
  }

  const inputCode = chooseEffectiveCode((vatCodes ?? []) as VatCodeRow[], "input");
  const outputCode = chooseEffectiveCode((vatCodes ?? []) as VatCodeRow[], "output");

  let inputVatCents = 0n;
  let outputVatCents = 0n;

  const explainabilityLines: VatReviewPreviewResult["explainability"]["lines"] = [];
  const normalizedTransactions = ((transactions ?? []) as PreviewTransactionRow[]).map((transaction) => {
    const grossCents = parseMoneyToCents(String(transaction.amount));
    const effectiveCode = transaction.type === "expense" ? inputCode : outputCode;
    const vatCents = computeVatFromGross(grossCents, effectiveCode.ratePpm);
    const baseCents = grossCents - vatCents;

    if (transaction.type === "expense") {
      inputVatCents += vatCents;
    } else {
      outputVatCents += vatCents;
    }

    explainabilityLines.push({
      transaction_id: transaction.id,
      transaction_type: transaction.type,
      transaction_date: transaction.date,
      gross_amount_decimal: centsToDecimal(grossCents),
      vat_code: effectiveCode.code,
      vat_rate_decimal: effectiveCode.rateDecimal,
      vat_rate_source_scope: effectiveCode.sourceScope,
      taxable_base_decimal: centsToDecimal(baseCents),
      vat_amount_decimal: centsToDecimal(vatCents)
    });

    return {
      id: transaction.id,
      date: transaction.date,
      type: transaction.type,
      amount_decimal: centsToDecimal(grossCents)
    };
  });

  const payloadForHash = {
    company_id: companyId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    engine_version: engineVersion,
    rate_sources: {
      input: { code: inputCode.code, rate_decimal: inputCode.rateDecimal, source_scope: inputCode.sourceScope },
      output: { code: outputCode.code, rate_decimal: outputCode.rateDecimal, source_scope: outputCode.sourceScope }
    },
    transactions: normalizedTransactions
  };

  const inputHash = crypto.createHash("sha256").update(JSON.stringify(payloadForHash)).digest("hex");

  return {
    company_id: companyId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    engine_version: engineVersion,
    input_hash: inputHash,
    totals: {
      output_vat_total: centsToDecimal(outputVatCents),
      input_vat_total: centsToDecimal(inputVatCents),
      net_vat_decimal: centsToDecimal(outputVatCents - inputVatCents)
    },
    explainability: {
      assumptions: [
        "Assumption: transactions.amount is treated as VAT-inclusive gross amount for baseline preview computation.",
        "TODO: add legal-form-specific VAT behavior (enkeltmandsvirksomhed vs ApS) once repository evidence exists.",
        "TODO: replace single-rate direction mapping with full VAT rule engine when implemented."
      ],
      legal_form_behavior: "TODO",
      taxable_base_provenance: "transactions.amount treated as VAT-inclusive gross amount",
      rate_sources: {
        input: toPublicVatCodeExplainability(inputCode),
        output: toPublicVatCodeExplainability(outputCode)
      },
      lines: explainabilityLines
    }
  };
}
