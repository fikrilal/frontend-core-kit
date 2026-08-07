import { describe, expect, it } from "vitest";

import type { ApiResult } from "@/server/api";

import { mapRequestAccountDeletionFailure } from "./request-account-deletion-failure";

describe("mapRequestAccountDeletionFailure", () => {
  it("maps a last-admin problem to lastAdmin", () => {
    expect(
      mapRequestAccountDeletionFailure(
        problemResult("USERS_CANNOT_DELETE_LAST_ADMIN", 409),
      ),
    ).toBe("lastAdmin");
  });

  it("maps a conflict problem to conflict", () => {
    expect(
      mapRequestAccountDeletionFailure(problemResult("CONFLICT", 409)),
    ).toBe("conflict");
  });

  it("falls back to conflict for HTTP 409", () => {
    expect(
      mapRequestAccountDeletionFailure(problemResult("SOME_OTHER_CODE", 409)),
    ).toBe("conflict");
  });

  it("maps network and unexpected failures to unavailable", () => {
    expect(
      mapRequestAccountDeletionFailure({
        failure: {
          kind: "network",
          message: "Network error",
        },
        ok: false,
        status: null,
        traceId: "trace-id",
      }),
    ).toBe("unavailable");
    expect(
      mapRequestAccountDeletionFailure(problemResult("INTERNAL", 500)),
    ).toBe("unavailable");
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
