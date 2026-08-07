import "server-only";

import type { ApiResult } from "@/server/api";

import type { ChangePasswordError } from "./change-password-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapChangePasswordFailure(
  result: FailedApiResult,
): ChangePasswordError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "AUTH_CURRENT_PASSWORD_INVALID":
        return "invalidCurrentPassword";
      case "AUTH_PASSWORD_NOT_SET":
        return "passwordNotSet";
      case "CONFLICT":
        return "conflict";
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
    case 409:
      return "conflict";
    case null:
    default:
      return "unavailable";
  }
}
