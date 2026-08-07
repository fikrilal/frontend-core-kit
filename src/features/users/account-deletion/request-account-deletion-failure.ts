import "server-only";

import type { ApiResult } from "@/server/api";

import type { RequestAccountDeletionError } from "./request-account-deletion-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapRequestAccountDeletionFailure(
  result: FailedApiResult,
): RequestAccountDeletionError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "USERS_CANNOT_DELETE_LAST_ADMIN":
        return "lastAdmin";
      case "CONFLICT":
        return "conflict";
      default:
        break;
    }
  }

  switch (result.status) {
    case 409:
      return "conflict";
    case null:
    default:
      return "unavailable";
  }
}
