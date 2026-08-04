import "server-only";

import type { ApiResult } from "@/server/api";

import type { EmailVerificationResendError } from "./email-verification-resend-state";

type FailedApiResult = Extract<ApiResult<unknown>, { ok: false }>;

export function mapEmailVerificationResendFailure(
  result: FailedApiResult,
): EmailVerificationResendError {
  if (
    result.failure.kind === "problem" &&
    result.failure.problem.code === "RATE_LIMITED"
  ) {
    return "rateLimited";
  }

  return result.status === 429 ? "rateLimited" : "unavailable";
}
