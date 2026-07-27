import { describe, expect, it } from "vitest";

import { syncFreshness } from "./sync-freshness";

describe("syncFreshness", () => {
  const now = Date.parse("2026-07-15T12:00:00.000Z");

  it("classifies fresh, stale, and never", () => {
    expect(syncFreshness("2026-07-15T11:00:00.000Z", now)).toBe("fresh");
    expect(syncFreshness("2026-07-13T00:00:00.000Z", now)).toBe("stale");
    expect(syncFreshness(null, now)).toBe("never");
    expect(syncFreshness("garbage", now)).toBe("never");
  });
});
