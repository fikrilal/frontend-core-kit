export type SyncFreshness = "fresh" | "stale" | "never";

/** Desktop pushes daily; allow ~1.5 days before calling a sync stale. */
const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

/** Classify a last-sync timestamp for freshness indicators. */
export function syncFreshness(
  lastSyncAt: string | null | undefined,
  nowMs: number = Date.now(),
): SyncFreshness {
  if (!lastSyncAt) {
    return "never";
  }
  const then = Date.parse(lastSyncAt);
  if (!Number.isFinite(then)) {
    return "never";
  }
  return nowMs - then <= STALE_AFTER_MS ? "fresh" : "stale";
}
