import "server-only";

import type { ApiResult } from "@/server/api";

import type { RevokeSessionError } from "./revoke-session-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapRevokeSessionFailure(
  result: FailedApiResult,
): RevokeSessionError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "NOT_FOUND":
        return "notFound";
      case "VALIDATION_FAILED":
        return "invalidInput";
      default:
        break;
    }
  }

  switch (result.status) {
    case 404:
      return "notFound";
    case 400:
    case 422:
      return "invalidInput";
    case null:
    default:
      return "unavailable";
  }
}
