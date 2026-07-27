import { describe, expect, it } from "vitest";

import { initialsFor } from "./initials";

describe("initialsFor", () => {
  it("takes the first two word initials from display names", () => {
    expect(initialsFor("Ahmad Fikril Al Muzakki")).toBe("AF");
    expect(initialsFor("madonna")).toBe("M");
  });

  it("takes the first letter of emails and handles empty labels", () => {
    expect(initialsFor("fikri@example.com")).toBe("F");
    expect(initialsFor(undefined)).toBe("?");
    expect(initialsFor("   ")).toBe("?");
  });
});
