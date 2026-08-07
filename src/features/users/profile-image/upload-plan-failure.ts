import "server-only";

import type { ApiResult } from "@/server/api";

import type { ProfileImageUploadError } from "./upload-plan-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapProfileImageUploadFailure(
  result: FailedApiResult,
): ProfileImageUploadError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "RATE_LIMITED":
        return "rateLimited";
      case "CONFLICT":
        return "conflict";
      case "VALIDATION_FAILED":
        return "invalidInput";
      default:
        break;
    }
  }

  switch (result.status) {
    case 429:
      return "rateLimited";
    case 409:
      return "conflict";
    case 400:
    case 422:
      return "invalidInput";
    case null:
    default:
      return "unavailable";
  }
}
