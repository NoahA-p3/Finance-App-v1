import { decimalStringToCentsBigInt } from "@/lib/finance-decimals";

export function normalizeCurrencyCode(currencyCode?: string | null) {
  const normalized = currencyCode?.trim().toUpperCase();
  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : "DKK";
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

export function formatCurrencyFromCents(cents: bigint | `${bigint}`, currencyCode?: string | null) {
  const centsBigInt = typeof cents === "bigint" ? cents : BigInt(cents);
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizeCurrencyCode(currencyCode)
  });

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

function amountToCents(amount: string | number) {
  const normalized = String(amount).trim();

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const isNegative = normalized.startsWith("-");
  const absoluteAmount = isNegative ? normalized.slice(1) : normalized;

  try {
    const cents = decimalStringToCentsBigInt(absoluteAmount);
    return isNegative ? -cents : cents;
  } catch {
    return null;
  }
}

export function formatCurrencyFromDecimalAmount(amount: string | number, currencyCode?: string | null) {
  const cents = amountToCents(amount);

  if (cents === null) {
    return String(amount);
  }

  return formatCurrencyFromCents(cents, currencyCode);
}
