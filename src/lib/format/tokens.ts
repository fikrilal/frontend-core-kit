/**
 * Format API token counts (number | string) for display.
 */
export function formatTokenCount(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) {
    return String(value);
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Compact token count for dense chart/model labels (e.g. "12.4K").
 */
export function formatTokenCompact(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) {
    return String(value);
  }
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Numeric form of an API token count for comparisons/sorting.
 * Returns null when the value is missing or unparseable.
 */
export function tokenCountToNumber(
  value: number | string | null | undefined,
): number | null {
  if (value == null) {
    return null;
  }
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

/**
 * Relative-friendly last sync label. Returns null when never synced.
 */
export function formatLastSyncAt(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  if (!iso) {
    return null;
  }
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) {
    return null;
  }

  const deltaSec = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (deltaSec < 60) {
    return "just now";
  }
  if (deltaSec < 3600) {
    const m = Math.floor(deltaSec / 60);
    return `${m}m ago`;
  }
  if (deltaSec < 86400) {
    const h = Math.floor(deltaSec / 3600);
    return `${h}h ago`;
  }
  const d = Math.floor(deltaSec / 86400);
  if (d < 14) {
    return `${d}d ago`;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(then));
}
