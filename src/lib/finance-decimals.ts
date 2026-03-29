const DECIMAL_STRING_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export function decimalStringToCentsBigInt(value: string): bigint {
  const normalized = value.trim();

  if (!DECIMAL_STRING_PATTERN.test(normalized)) {
    throw new Error("Amount must be a non-negative decimal string with up to 2 decimal places.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const wholeCents = BigInt(whole) * 100n;
  const fractionCents = BigInt(fraction.padEnd(2, "0"));

  return wholeCents + fractionCents;
}

export function centsBigIntToDecimalString(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${sign}${whole.toString()}.${fraction}`;
}
