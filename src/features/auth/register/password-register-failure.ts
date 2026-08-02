import "server-only";

import type { ApiResult } from "@/server/api";

import type { RegisterError } from "./register-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapPasswordRegisterFailure(
  result: FailedApiResult,
): RegisterError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "AUTH_EMAIL_ALREADY_EXISTS":
        return "emailAlreadyExists";
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
      return "emailAlreadyExists";
    case null:
    default:
      return "unavailable";
  }
}
