import "server-only";

import type { ApiResult } from "@/server/api";

import type { PasswordResetRequestError } from "./password-reset-request-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapPasswordResetRequestFailure(
  result: FailedApiResult,
): PasswordResetRequestError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "RATE_LIMITED":
        return "rateLimited";
      case "VALIDATION_FAILED":
        return "invalidInput";
      default:
        break;
    }
  }

  switch (result.status) {
    case 400:
    case 422:
      return "invalidInput";
    case 429:
      return "rateLimited";
    case null:
    default:
      return "unavailable";
  }
}
