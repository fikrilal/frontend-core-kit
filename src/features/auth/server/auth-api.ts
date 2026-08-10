import "server-only";

import type { operations } from "@/contracts/example-api";
import {
  AuthPasswordRegisterResponse,
  AuthPasswordLoginResponse,
  UsersMeGetResponse,
} from "@/contracts/example-api/runtime";
import {
  createConfiguredExampleApiClient,
  readApiResult,
  readEmptyApiResult,
  type ApiResult,
} from "@/server/api";

const passwordLoginPath = "/v1/auth/password/login" as const;
const passwordRegisterPath = "/v1/auth/password/register" as const;
const passwordChangePath = "/v1/auth/password/change" as const;
const emailVerifyPath = "/v1/auth/email/verify" as const;
const passwordResetRequestPath = "/v1/auth/password/reset/request" as const;
const passwordResetConfirmPath = "/v1/auth/password/reset/confirm" as const;
const emailVerificationResendPath =
  "/v1/auth/email/verification/resend" as const;
const currentUserPath = "/v1/me" as const;
const logoutPath = "/v1/auth/logout" as const;
const authRequestTimeoutMs = 10_000;

type PasswordLoginOperation = operations["auth.password.login"];
type PasswordRegisterOperation = operations["auth.password.register"];
type PasswordChangeOperation = operations["auth.password.change"];
type EmailVerifyOperation = operations["auth.email.verify"];
type PasswordResetRequestOperation = operations["auth.password.reset.request"];
type PasswordResetConfirmOperation = operations["auth.password.reset.confirm"];
type PasswordLoginEnvelope =
  PasswordLoginOperation["responses"][200]["content"]["application/json"];
type PasswordRegisterEnvelope =
  PasswordRegisterOperation["responses"][200]["content"]["application/json"];
type CurrentUserOperation = operations["users.me.get"];
type CurrentUserEnvelope =
  CurrentUserOperation["responses"][200]["content"]["application/json"];

export type PasswordLoginInput =
  PasswordLoginOperation["requestBody"]["content"]["application/json"];
export type PasswordLoginData = PasswordLoginEnvelope["data"];
export type PasswordRegisterInput =
  PasswordRegisterOperation["requestBody"]["content"]["application/json"];
export type PasswordChangeInput =
  PasswordChangeOperation["requestBody"]["content"]["application/json"];
export type EmailVerifyInput =
  EmailVerifyOperation["requestBody"]["content"]["application/json"];
export type PasswordResetRequestInput =
  PasswordResetRequestOperation["requestBody"]["content"]["application/json"];
export type PasswordResetConfirmInput =
  PasswordResetConfirmOperation["requestBody"]["content"]["application/json"];
export type PasswordRegisterData = PasswordRegisterEnvelope["data"];
export type CurrentUserData = CurrentUserEnvelope["data"];

export async function registerWithPassword(
  input: PasswordRegisterInput,
): Promise<ApiResult<PasswordRegisterData>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(passwordRegisterPath, {
    body: input,
    cache: "no-store",
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readApiResult(request, AuthPasswordRegisterResponse);
}

export async function verifyEmail(
  input: EmailVerifyInput,
): Promise<ApiResult<undefined>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(emailVerifyPath, {
    body: input,
    cache: "no-store",
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readEmptyApiResult(request);
}

export async function changePassword(
  input: PasswordChangeInput,
  accessToken: string,
): Promise<ApiResult<undefined>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(passwordChangePath, {
    body: input,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readEmptyApiResult(request);
}

export async function resendEmailVerification(
  accessToken: string,
): Promise<ApiResult<undefined>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(emailVerificationResendPath, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readEmptyApiResult(request);
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput,
): Promise<ApiResult<undefined>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(passwordResetRequestPath, {
    body: input,
    cache: "no-store",
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readEmptyApiResult(request);
}

export async function confirmPasswordReset(
  input: PasswordResetConfirmInput,
): Promise<ApiResult<undefined>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(passwordResetConfirmPath, {
    body: input,
    cache: "no-store",
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readEmptyApiResult(request);
}

export async function loginWithPassword(
  input: PasswordLoginInput,
): Promise<ApiResult<PasswordLoginData>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(passwordLoginPath, {
    body: input,
    cache: "no-store",
    // Keep parsing and validation inside the explicit Zod boundary below.
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readApiResult(request, AuthPasswordLoginResponse);
}

export async function getCurrentUser(
  accessToken: string,
): Promise<ApiResult<CurrentUserData>> {
  const client = createConfiguredExampleApiClient();
  const request = client.GET(currentUserPath, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readApiResult(request, UsersMeGetResponse);
}

export async function logoutRemoteSession(
  refreshToken: string,
): Promise<ApiResult<undefined>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(logoutPath, {
    body: { refreshToken },
    cache: "no-store",
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readEmptyApiResult(request);
}
