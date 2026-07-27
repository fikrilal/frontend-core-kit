const DAY_MS = 24 * 60 * 60 * 1000;

export interface DateWindow {
  /** Inclusive YYYY-MM-DD range start. */
  from: string;
  /** Inclusive YYYY-MM-DD range end ("today" in the timezone). */
  to: string;
}

/**
 * Inclusive YYYY-MM-DD window of `days` length ending on "today" in the given
 * IANA timezone, matching how lamara-api aggregates daily usage.
 */
export function rollingDateWindow(options: {
  timezone: string;
  days: number;
  now?: Date;
}): DateWindow {
  const { timezone } = options;
  const days = Math.max(1, Math.floor(options.days));
  const now = options.now ?? new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  const todayUtcMs = Date.UTC(year, month - 1, day);
  const fromUtcMs = todayUtcMs - (days - 1) * DAY_MS;

  return { from: formatUtcDate(fromUtcMs), to: formatUtcDate(todayUtcMs) };
}

function formatUtcDate(utcMs: number): string {
  const date = new Date(utcMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
