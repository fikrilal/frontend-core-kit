import { describe, expect, it } from "vitest";

import type { ApiFailure, ApiResult } from "@/server/api";

import { mapPasswordResetRequestFailure } from "./password-reset-request-failure";

describe("mapPasswordResetRequestFailure", () => {
  it.each([
    ["RATE_LIMITED", "rateLimited"],
    ["VALIDATION_FAILED", "invalidInput"],
  ] as const)("maps backend code %s to %s", (code, expected) => {
    expect(mapPasswordResetRequestFailure(problemResult(code, 400))).toBe(
      expected,
    );
  });

  it.each([
    [400, "invalidInput"],
    [422, "invalidInput"],
    [429, "rateLimited"],
    [500, "unavailable"],
  ] as const)(
    "falls back from an unknown code at status %s",
    (status, expected) => {
      expect(
        mapPasswordResetRequestFailure(problemResult("UNKNOWN_CODE", status)),
      ).toBe(expected);
    },
  );

  it.each<ApiFailure>([
    { kind: "network", message: "Unable to reach Example API." },
    {
      kind: "timeout",
      outcome: "unknown",
      message: "Example API request timed out.",
    },
    { kind: "cancelled", message: "Example API request was cancelled." },
    {
      kind: "invalid-response",
      message: "Example API returned an invalid response.",
    },
  ])("maps $kind failures to unavailable", (failure) => {
    expect(
      mapPasswordResetRequestFailure({
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
