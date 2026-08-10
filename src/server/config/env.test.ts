import { describe, expect, it } from "vitest";

import { readApiConfig, readSessionConfig } from "./env";

describe("server configuration", () => {
  it("normalizes a valid API origin", () => {
    expect(
      readApiConfig({
        EXAMPLE_API_BASE_URL: "https://api.example.dev/",
      }),
    ).toEqual({
      apiBaseUrl: "https://api.example.dev",
    });
  });

  it("validates session configuration", () => {
    expect(
      readSessionConfig({
        LAMARA_SESSION_TTL_SECONDS: "2592000",
      }),
    ).toEqual({
      sessionTtlSeconds: 2_592_000,
      secureCookies: false,
    });
  });

  it.each([
    undefined,
    "ftp://api.example.dev",
    "https://user:secret@api.example.dev",
    "https://api.example.dev/v1",
    "https://api.example.dev?target=other",
    "https://api.example.dev#fragment",
  ])("rejects an invalid API origin: %s", (value) => {
    expect(() =>
      readApiConfig({
        EXAMPLE_API_BASE_URL: value,
      }),
    ).toThrow();
  });

  it.each([undefined, "0", "299", "31536001", "not-a-number"])(
    "rejects an invalid session TTL: %s",
    (value) => {
      expect(() =>
        readSessionConfig({
          LAMARA_SESSION_TTL_SECONDS: value,
        }),
      ).toThrow();
    },
  );
});
