import type { SyncFreshness } from "@/lib/format/sync-freshness";
import { cn } from "@/lib/utils";

/** Small status dot: green fresh, amber stale, muted never synced. */
export function FreshnessDot({ freshness }: { freshness: SyncFreshness }) {
  const className =
    freshness === "fresh"
      ? "bg-success"
      : freshness === "stale"
        ? "bg-warning"
        : "bg-muted-foreground/40";
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 rounded-full", className)}
    />
  );
}
