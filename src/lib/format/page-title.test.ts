import { describe, expect, it } from "vitest";

import { pageTitle } from "./page-title";

describe("pageTitle", () => {
  it("formats a Lamara page title", () => {
    expect(pageTitle("Download")).toBe("Download | Lamara");
  });
});
