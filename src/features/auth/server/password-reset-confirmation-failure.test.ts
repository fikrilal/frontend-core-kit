import { describe, expect, it } from "vitest";

import type { ApiResult } from "@/server/api";

import { mapPasswordResetConfirmationFailure } from "./password-reset-confirmation-failure";

describe("mapPasswordResetConfirmationFailure", () => {
  it.each([
    "AUTH_PASSWORD_RESET_TOKEN_INVALID",
    "AUTH_PASSWORD_RESET_TOKEN_EXPIRED",
  ])("maps %s to one safe invalid-token state", (code) => {
    expect(mapPasswordResetConfirmationFailure(problemResult(code, 400))).toBe(
      "invalidToken",
    );
  });

  it("maps validation failures to invalid input", () => {
    expect(
      mapPasswordResetConfirmationFailure(
        problemResult("VALIDATION_FAILED", 400),
      ),
    ).toBe("invalidInput");
    expect(
      mapPasswordResetConfirmationFailure(
        problemResult("VALIDATION_FAILED", 422),
      ),
    ).toBe("invalidInput");
  });

  it("uses a safe status fallback for an unrecognised bad request", () => {
    expect(
      mapPasswordResetConfirmationFailure(problemResult("UNKNOWN_CODE", 400)),
    ).toBe("invalidToken");
  });

  it.each([null, 408, 500])(
    "maps status %s and transport outcomes to unavailable",
    (status) => {
      expect(
        mapPasswordResetConfirmationFailure(
          status === null
            ? {
                failure: {
                  kind: "network",
                  message: "must-not-reach-ui",
                },
                ok: false,
                status: null,
                traceId: "trace-id",
              }
            : problemResult("INTERNAL", status),
        ),
      ).toBe("unavailable");
    },
  );
});

function problemResult(
  code: string,
  status: number,
): Extract<ApiResult<unknown>, { ok: false }> {
  return {
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
    ok: false,
    status,
    traceId: "trace-id",
  };
}
