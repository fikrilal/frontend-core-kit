import "server-only";

import type { ApiResult } from "@/server/api";

import type { EmailVerificationError } from "../email-verification-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapEmailVerificationFailure(
  result: FailedApiResult,
): EmailVerificationError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "AUTH_EMAIL_VERIFICATION_TOKEN_INVALID":
      case "AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRED":
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
