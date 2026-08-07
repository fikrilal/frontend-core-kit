import "server-only";

import type { ApiResult } from "@/server/api";

import type { UpdateProfileError } from "./update-profile-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapUpdateProfileFailure(
  result: FailedApiResult,
): UpdateProfileError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "VALIDATION_FAILED":
        return "invalidInput";
      case "CONFLICT":
        return "conflict";
      default:
        break;
    }
  }

  switch (result.status) {
    case 400:
    case 422:
      return "invalidInput";
    case 409:
      return "conflict";
    case null:
    default:
      return "unavailable";
  }
}
