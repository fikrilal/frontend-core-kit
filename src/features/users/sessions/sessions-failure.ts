import "server-only";

import type { ApiResult } from "@/server/api";

export type SessionsError = "invalidInput" | "unavailable";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapSessionsFailure(result: FailedApiResult): SessionsError {
  if (
    result.failure.kind === "problem" &&
    result.failure.problem.code === "VALIDATION_FAILED"
  ) {
    return "invalidInput";
  }

  return result.status === 400 || result.status === 422
    ? "invalidInput"
    : "unavailable";
}
