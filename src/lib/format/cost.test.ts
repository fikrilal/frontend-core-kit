import { describe, expect, it } from "vitest";

import { formatCostFromMicros } from "./cost";

describe("formatCostFromMicros", () => {
  it("formats micros as currency", () => {
    expect(formatCostFromMicros(12_500_000, "USD")).toMatch(/12\.50/);
    expect(formatCostFromMicros("430000", "USD")).toMatch(/0\.43/);
  });

  it("falls back to USD when currency is missing", () => {
    expect(formatCostFromMicros(1_000_000, null)).toMatch(/1\.00/);
  });

  it("returns null for missing or unparseable amounts", () => {
    expect(formatCostFromMicros(null, "USD")).toBeNull();
    expect(formatCostFromMicros(undefined, "USD")).toBeNull();
    expect(formatCostFromMicros("nope", "USD")).toBeNull();
  });
});
