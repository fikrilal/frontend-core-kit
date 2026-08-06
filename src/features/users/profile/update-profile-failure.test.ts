import { describe, expect, it } from "vitest";

import type { ApiResult } from "@/server/api";

import { mapUpdateProfileFailure } from "./update-profile-failure";

describe("mapUpdateProfileFailure", () => {
  it("maps a validation problem to invalidInput", () => {
    expect(
      mapUpdateProfileFailure(problemResult("VALIDATION_FAILED", 422)),
    ).toBe("invalidInput");
  });

  it("maps a conflict problem to conflict", () => {
    expect(mapUpdateProfileFailure(problemResult("CONFLICT", 409))).toBe(
      "conflict",
    );
  });

  it("falls back to invalidInput for HTTP 400 and 422", () => {
    expect(mapUpdateProfileFailure(problemResult("SOME_OTHER_CODE", 400))).toBe(
      "invalidInput",
    );
    expect(mapUpdateProfileFailure(problemResult("SOME_OTHER_CODE", 422))).toBe(
      "invalidInput",
    );
  });

  it("falls back to conflict for HTTP 409", () => {
    expect(mapUpdateProfileFailure(problemResult("SOME_OTHER_CODE", 409))).toBe(
      "conflict",
    );
  });

  it("maps network and unexpected failures to unavailable", () => {
    expect(
      mapUpdateProfileFailure({
        failure: {
          kind: "network",
          message: "Network error",
        },
        ok: false,
        status: null,
        traceId: "trace-id",
      }),
    ).toBe("unavailable");
    expect(mapUpdateProfileFailure(problemResult("INTERNAL", 500))).toBe(
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
