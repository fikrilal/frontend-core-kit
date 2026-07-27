import { describe, expect, it } from "vitest";

import {
  formatLastSyncAt,
  formatTokenCompact,
  formatTokenCount,
  tokenCountToNumber,
} from "./tokens";

describe("formatTokenCount", () => {
  it("formats numbers and numeric strings", () => {
    expect(formatTokenCount(12345)).toMatch(/12[,.]?345/);
    expect(formatTokenCount("1000")).toMatch(/1[,.]?000/);
  });

  it("returns the original string when not finite", () => {
    expect(formatTokenCount("not-a-number")).toBe("not-a-number");
  });
});

describe("formatTokenCompact", () => {
  it("formats with compact notation", () => {
    expect(formatTokenCompact(12345)).toMatch(/12\.3K/);
    expect(formatTokenCompact("2000000")).toMatch(/2M/);
    expect(formatTokenCompact(900)).toMatch(/900/);
  });
});

describe("tokenCountToNumber", () => {
  it("converts numbers and numeric strings", () => {
    expect(tokenCountToNumber(42)).toBe(42);
    expect(tokenCountToNumber("42")).toBe(42);
  });

  it("returns null for missing or unparseable values", () => {
    expect(tokenCountToNumber(null)).toBeNull();
    expect(tokenCountToNumber(undefined)).toBeNull();
    expect(tokenCountToNumber("nope")).toBeNull();
  });
});

describe("formatLastSyncAt", () => {
  const now = Date.parse("2026-07-15T12:00:00.000Z");

  it("returns null for missing timestamps", () => {
    expect(formatLastSyncAt(null, now)).toBeNull();
    expect(formatLastSyncAt(undefined, now)).toBeNull();
  });

  it("returns relative labels", () => {
    expect(formatLastSyncAt("2026-07-15T11:59:30.000Z", now)).toBe("just now");
    expect(formatLastSyncAt("2026-07-15T11:30:00.000Z", now)).toBe("30m ago");
    expect(formatLastSyncAt("2026-07-15T08:00:00.000Z", now)).toBe("4h ago");
    expect(formatLastSyncAt("2026-07-13T12:00:00.000Z", now)).toBe("2d ago");
  });
});
