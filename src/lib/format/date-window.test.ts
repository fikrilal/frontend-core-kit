import { describe, expect, it } from "vitest";

import { rollingDateWindow } from "./date-window";

describe("rollingDateWindow", () => {
  it("returns an inclusive window ending today in UTC", () => {
    const window = rollingDateWindow({
      timezone: "UTC",
      days: 14,
      now: new Date("2026-07-15T12:00:00.000Z"),
    });

    expect(window).toEqual({ from: "2026-07-02", to: "2026-07-15" });
  });

  it("uses the timezone's calendar date, not the UTC date", () => {
    // 2026-07-15T18:30:00Z is already 2026-07-16 01:30 in Asia/Jakarta.
    const window = rollingDateWindow({
      timezone: "Asia/Jakarta",
      days: 14,
      now: new Date("2026-07-15T18:30:00.000Z"),
    });

    expect(window).toEqual({ from: "2026-07-03", to: "2026-07-16" });
  });

  it("crosses month boundaries", () => {
    const window = rollingDateWindow({
      timezone: "UTC",
      days: 30,
      now: new Date("2026-07-15T12:00:00.000Z"),
    });

    expect(window).toEqual({ from: "2026-06-16", to: "2026-07-15" });
  });

  it("clamps days to at least 1", () => {
    const window = rollingDateWindow({
      timezone: "UTC",
      days: 0,
      now: new Date("2026-07-15T12:00:00.000Z"),
    });

    expect(window).toEqual({ from: "2026-07-15", to: "2026-07-15" });
  });
});
