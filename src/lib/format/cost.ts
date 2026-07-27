/**
 * Format API cost amounts (micro-dollars as number | string) for display.
 * Returns null when the amount is missing or unparseable.
 */
export function formatCostFromMicros(
  amountMicros: number | string | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (amountMicros == null) {
    return null;
  }
  const micros =
    typeof amountMicros === "string" ? Number(amountMicros) : amountMicros;
  if (!Number.isFinite(micros)) {
    return null;
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency ?? "USD",
  }).format(micros / 1_000_000);
}
