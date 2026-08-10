import { describe, expect, it } from "vitest";

import type { ApiResult } from "@/server/api";

import { mapCompleteProfileImageUploadFailure } from "./complete-upload-failure";

describe("mapCompleteProfileImageUploadFailure", () => {
  it("maps a not-found problem to notFound", () => {
    expect(
      mapCompleteProfileImageUploadFailure(problemResult("NOT_FOUND", 404)),
    ).toBe("notFound");
  });

  it("maps upload mismatch problems to mismatch", () => {
    expect(
      mapCompleteProfileImageUploadFailure(
        problemResult("USERS_PROFILE_IMAGE_NOT_UPLOADED", 422),
      ),
    ).toBe("mismatch");
    expect(
      mapCompleteProfileImageUploadFailure(
        problemResult("USERS_PROFILE_IMAGE_SIZE_MISMATCH", 422),
      ),
    ).toBe("mismatch");
    expect(
      mapCompleteProfileImageUploadFailure(
        problemResult("USERS_PROFILE_IMAGE_CONTENT_TYPE_MISMATCH", 422),
      ),
    ).toBe("mismatch");
  });

  it("falls back to notFound for HTTP 404", () => {
    expect(
      mapCompleteProfileImageUploadFailure(
        problemResult("SOME_OTHER_CODE", 404),
      ),
    ).toBe("notFound");
  });

  it("falls back to mismatch for HTTP 400 and 422", () => {
    expect(
      mapCompleteProfileImageUploadFailure(
        problemResult("SOME_OTHER_CODE", 400),
      ),
    ).toBe("mismatch");
    expect(
      mapCompleteProfileImageUploadFailure(
        problemResult("SOME_OTHER_CODE", 422),
      ),
    ).toBe("mismatch");
  });

  it("maps network and unexpected failures to unavailable", () => {
    expect(
      mapCompleteProfileImageUploadFailure({
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
      mapCompleteProfileImageUploadFailure(problemResult("INTERNAL", 500)),
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
