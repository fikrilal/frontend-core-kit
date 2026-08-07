import { describe, expect, it } from "vitest";

import type { ApiResult } from "@/server/api";

import { mapRevokeSessionFailure } from "./revoke-session-failure";

describe("mapRevokeSessionFailure", () => {
  it("maps a not-found problem to notFound", () => {
    expect(mapRevokeSessionFailure(problemResult("NOT_FOUND", 404))).toBe(
      "notFound",
    );
  });

  it("maps a validation problem to invalidInput", () => {
    expect(
      mapRevokeSessionFailure(problemResult("VALIDATION_FAILED", 422)),
    ).toBe("invalidInput");
  });

  it("falls back to notFound for HTTP 404", () => {
    expect(mapRevokeSessionFailure(problemResult("SOME_OTHER_CODE", 404))).toBe(
      "notFound",
    );
  });

  it("falls back to invalidInput for HTTP 400 and 422", () => {
    expect(mapRevokeSessionFailure(problemResult("SOME_OTHER_CODE", 400))).toBe(
      "invalidInput",
    );
    expect(mapRevokeSessionFailure(problemResult("SOME_OTHER_CODE", 422))).toBe(
      "invalidInput",
    );
  });

  it("maps network and unexpected failures to unavailable", () => {
    expect(
      mapRevokeSessionFailure({
        failure: {
          kind: "network",
          message: "Network error",
        },
        ok: false,
        status: null,
        traceId: "trace-id",
      }),
    ).toBe("unavailable");
    expect(mapRevokeSessionFailure(problemResult("INTERNAL", 500))).toBe(
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
