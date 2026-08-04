import { describe, expect, it } from "vitest";

import type { ApiResult } from "@/server/api";

import { mapEmailVerificationResendFailure } from "./email-verification-resend-failure";

describe("mapEmailVerificationResendFailure", () => {
  it("maps the stable rate-limit code", () => {
    expect(
      mapEmailVerificationResendFailure(problemResult("RATE_LIMITED", 429)),
    ).toBe("rateLimited");
  });

  it("uses the HTTP rate-limit fallback", () => {
    expect(
      mapEmailVerificationResendFailure(problemResult("UNKNOWN_CODE", 429)),
    ).toBe("rateLimited");
  });

  it.each([null, 400, 500])("maps status %s to unavailable", (status) => {
    expect(
      mapEmailVerificationResendFailure(
        status === null
          ? {
              failure: { kind: "network", message: "unreachable" },
              ok: false,
              status: null,
              traceId: "trace-id",
            }
          : problemResult("INTERNAL", status),
      ),
    ).toBe("unavailable");
  });
});

function problemResult(
  code: string,
  status: number,
): Extract<ApiResult<never>, { ok: false }> {
  return {
    failure: {
      kind: "problem",
      problem: {
        type: "about:blank",
        title: "Backend details must not become UI copy",
        status,
        code,
        traceId: "trace-id",
      },
    },
    ok: false,
    status,
    traceId: "trace-id",
  };
}
