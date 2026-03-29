import type { Database } from "@/types/database";

export type CanonicalPostingTransactionType = "expense" | "revenue";

interface LineAccounts {
  debitAccountCode: string;
  creditAccountCode: string;
}

const ACCOUNT_CODE_BY_TRANSACTION_TYPE: Record<CanonicalPostingTransactionType, LineAccounts> = {
  expense: {
    debitAccountCode: "operating_expense",
    creditAccountCode: "cash"
  },
  revenue: {
    debitAccountCode: "cash",
    creditAccountCode: "operating_revenue"
  }
};

const TRANSACTION_TYPE_FALLBACK_ALIASES: Record<string, CanonicalPostingTransactionType> = {
  income: "revenue",
  sale: "revenue",
  cost: "expense"
};

function normalizeTransactionType(value: string): string {
  return value.trim().toLowerCase();
}

export function toCanonicalPostingTransactionType(
  transactionType: Database["public"]["Tables"]["transactions"]["Row"]["type"]
): CanonicalPostingTransactionType {
  const normalized = normalizeTransactionType(transactionType);

  if (!normalized) {
    throw new Error("Transaction type is required for posting account mapping.");
  }

  if (normalized in ACCOUNT_CODE_BY_TRANSACTION_TYPE) {
    return normalized as CanonicalPostingTransactionType;
  }

  const fallbackType = TRANSACTION_TYPE_FALLBACK_ALIASES[normalized];
  if (fallbackType) {
    return fallbackType;
  }

  throw new Error(`No posting account mapping configured for transaction type: ${transactionType}`);
}

export function deriveLineAccounts(
  transactionType: Database["public"]["Tables"]["transactions"]["Row"]["type"]
): LineAccounts {
  const canonicalType = toCanonicalPostingTransactionType(transactionType);
  return ACCOUNT_CODE_BY_TRANSACTION_TYPE[canonicalType];
}
