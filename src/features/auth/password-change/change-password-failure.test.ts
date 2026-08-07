import { describe, expect, it } from "vitest";

import type { ApiResult } from "@/server/api";

import { mapChangePasswordFailure } from "./change-password-failure";

describe("mapChangePasswordFailure", () => {
  it("maps an invalid current password to invalidCurrentPassword", () => {
    expect(
      mapChangePasswordFailure(
        problemResult("AUTH_CURRENT_PASSWORD_INVALID", 400),
      ),
    ).toBe("invalidCurrentPassword");
  });

  it("maps a missing password to passwordNotSet", () => {
    expect(
      mapChangePasswordFailure(problemResult("AUTH_PASSWORD_NOT_SET", 400)),
    ).toBe("passwordNotSet");
  });

  it("maps a conflict to conflict", () => {
    expect(mapChangePasswordFailure(problemResult("CONFLICT", 409))).toBe(
      "conflict",
    );
  });

  it("maps a validation problem to invalidInput", () => {
    expect(
      mapChangePasswordFailure(problemResult("VALIDATION_FAILED", 422)),
    ).toBe("invalidInput");
  });

  it("falls back to invalidInput for HTTP 400 and 422", () => {
    expect(
      mapChangePasswordFailure(problemResult("SOME_OTHER_CODE", 400)),
    ).toBe("invalidInput");
    expect(
      mapChangePasswordFailure(problemResult("SOME_OTHER_CODE", 422)),
    ).toBe("invalidInput");
  });

  it("falls back to conflict for HTTP 409", () => {
    expect(
      mapChangePasswordFailure(problemResult("SOME_OTHER_CODE", 409)),
    ).toBe("conflict");
  });

  it("maps network and unexpected failures to unavailable", () => {
    expect(
      mapChangePasswordFailure({
        failure: {
          kind: "network",
          message: "Network error",
        },
        ok: false,
        status: null,
        traceId: "trace-id",
      }),
    ).toBe("unavailable");
    expect(mapChangePasswordFailure(problemResult("INTERNAL", 500))).toBe(
      "unavailable",
    );
  });
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
        title: "Backend details must not become UI copy",
        status,
        code,
        traceId: "trace-id",
      },
    },
    ok: false,
    status,
    traceId: "trace-id",
  } as const;
}
