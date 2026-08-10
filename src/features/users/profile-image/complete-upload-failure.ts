import "server-only";

import type { ApiResult } from "@/server/api";

import type { CompleteProfileImageUploadError } from "./complete-upload-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapCompleteProfileImageUploadFailure(
  result: FailedApiResult,
): CompleteProfileImageUploadError {
  if (result.failure.kind === "problem") {
    switch (result.failure.problem.code) {
      case "NOT_FOUND":
        return "notFound";
      case "USERS_PROFILE_IMAGE_NOT_UPLOADED":
      case "USERS_PROFILE_IMAGE_SIZE_MISMATCH":
      case "USERS_PROFILE_IMAGE_CONTENT_TYPE_MISMATCH":
        return "mismatch";
      default:
        break;
    }
  }

  switch (result.status) {
    case 404:
      return "notFound";
    case 400:
    case 422:
      return "mismatch";
    case null:
    default:
      return "unavailable";
  }
}
