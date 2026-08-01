import { describe, expect, it } from "vitest";

import type { ApiResult } from "@/server/api";

import { mapPasswordRegisterFailure } from "./password-register-failure";

describe("mapPasswordRegisterFailure", () => {
  it("maps an existing email code", () => {
    expect(
      mapPasswordRegisterFailure(
        problemResult("AUTH_EMAIL_ALREADY_EXISTS", 409),
      ),
    ).toBe("emailAlreadyExists");
  });

  it("maps validation failures", () => {
    expect(
      mapPasswordRegisterFailure(problemResult("VALIDATION_FAILED", 400)),
    ).toBe("invalidInput");
    expect(
      mapPasswordRegisterFailure({
        ok: false,
        failure: { kind: "network", message: "unreachable" },
        status: null,
        traceId: "",
      }),
    ).toBe("unavailable");
  });
});

function problemResult(
  code: string,
  status: number,
): Extract<ApiResult<never>, { ok: false }> {
  return {
    ok: false,
    failure: {
      kind: "problem",
      problem: {
        type: "about:blank",
        title: "Request failed",
        status,
        code,
        traceId: "backend-request-id",
      },
    },
    status,
    traceId: "backend-request-id",
  };
}
