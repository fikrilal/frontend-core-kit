import "server-only";

import type { ApiResult } from "@/server/api";

import type { LoginError } from "../login-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapPasswordLoginFailure(result: FailedApiResult): LoginError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "AUTH_INVALID_CREDENTIALS":
        return "invalidCredentials";
      case "AUTH_USER_SUSPENDED":
        return "userSuspended";
      case "RATE_LIMITED":
        return "rateLimited";
      case "VALIDATION_FAILED":
        return "invalidInput";
    }
  }

  switch (result.status) {
    case 400:
    case 422:
      return "invalidInput";
    case 401:
      return "invalidCredentials";
    case 403:
      return "userSuspended";
    case 429:
      return "rateLimited";
    case null:
      return "unavailable";
    default:
      return "unavailable";
  }
}
