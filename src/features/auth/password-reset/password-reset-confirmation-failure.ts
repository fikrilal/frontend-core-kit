import "server-only";

import type { ApiResult } from "@/server/api";

import type { PasswordResetConfirmationError } from "./password-reset-confirmation-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapPasswordResetConfirmationFailure(
  result: FailedApiResult,
): PasswordResetConfirmationError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "AUTH_PASSWORD_RESET_TOKEN_INVALID":
      case "AUTH_PASSWORD_RESET_TOKEN_EXPIRED":
        return "invalidToken";
      case "VALIDATION_FAILED":
        return "invalidInput";
      default:
        break;
    }
  }

  switch (result.status) {
    case 400:
      return "invalidToken";
    case 422:
      return "invalidInput";
    case null:
    default:
      return "unavailable";
  }
}
