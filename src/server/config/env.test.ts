import { describe, expect, it } from "vitest";

import { readServerConfig } from "./env";

describe("readServerConfig", () => {
  it("normalizes a valid API origin", () => {
    expect(
      readServerConfig({
        LAMARA_API_BASE_URL: "https://api.lamara.dev/",
      }),
    ).toEqual({
      apiBaseUrl: "https://api.lamara.dev",
    });
  });

  it.each([
    undefined,
    "ftp://api.lamara.dev",
    "https://user:secret@api.lamara.dev",
    "https://api.lamara.dev/v1",
    "https://api.lamara.dev?target=other",
    "https://api.lamara.dev#fragment",
  ])("rejects an invalid API origin: %s", (value) => {
    expect(() =>
      readServerConfig({
        LAMARA_API_BASE_URL: value,
      }),
    ).toThrow();
  });
});
