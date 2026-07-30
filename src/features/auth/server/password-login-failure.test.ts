import { describe, expect, it } from "vitest";

import type { ApiFailure, ApiResult } from "@/server/api";

import { mapPasswordLoginFailure } from "./password-login-failure";

describe("mapPasswordLoginFailure", () => {
  it.each([
    ["AUTH_INVALID_CREDENTIALS", "invalidCredentials"],
    ["AUTH_USER_SUSPENDED", "userSuspended"],
    ["RATE_LIMITED", "rateLimited"],
    ["VALIDATION_FAILED", "invalidInput"],
  ] as const)("maps backend code %s to %s", (code, expected) => {
    expect(mapPasswordLoginFailure(problemResult(code, 400))).toBe(expected);
  });

  it("prefers a known backend code over HTTP status", () => {
    expect(
      mapPasswordLoginFailure(problemResult("AUTH_INVALID_CREDENTIALS", 429)),
    ).toBe("invalidCredentials");
  });

  it.each([
    [400, "invalidInput"],
    [401, "invalidCredentials"],
    [403, "userSuspended"],
    [422, "invalidInput"],
    [429, "rateLimited"],
    [500, "unavailable"],
  ] as const)(
    "falls back from an unknown code at status %s",
    (status, expected) => {
      expect(
        mapPasswordLoginFailure(problemResult("UNKNOWN_CODE", status)),
      ).toBe(expected);
    },
  );

  it.each<ApiFailure>([
    { kind: "network", message: "Unable to reach Lamara API." },
    {
      kind: "timeout",
      outcome: "unknown",
      message: "Lamara API request timed out.",
    },
    { kind: "cancelled", message: "Lamara API request was cancelled." },
    {
      kind: "invalid-response",
      message: "Lamara API returned an invalid response.",
    },
  ])("maps $kind failures to unavailable", (failure) => {
    expect(
      mapPasswordLoginFailure({
        ok: false,
        failure,
        status: null,
        traceId: "trace-id",
      }),
    ).toBe("unavailable");
  });
});

function problemResult(
  code: string,
  status: number,
): Extract<ApiResult<unknown>, { ok: false }> {
  return {
    ok: false,
    failure: {
      kind: "problem",
      problem: {
        type: "about:blank",
        title: "Backend title must not become UI copy",
        status,
        code,
        traceId: "trace-id",
      },
    },
    status,
    traceId: "trace-id",
  };
}
