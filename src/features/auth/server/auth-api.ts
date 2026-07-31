import "server-only";

import type { operations } from "@/contracts/lamara-api";
import {
  AuthPasswordRegisterResponse,
  AuthPasswordLoginResponse,
  UsersMeGetResponse,
} from "@/contracts/lamara-api/runtime";
import {
  createConfiguredLamaraApiClient,
  readApiResult,
  readEmptyApiResult,
  type ApiResult,
} from "@/server/api";

const passwordLoginPath = "/v1/auth/password/login" as const;
const passwordRegisterPath = "/v1/auth/password/register" as const;
const currentUserPath = "/v1/me" as const;
const logoutPath = "/v1/auth/logout" as const;
const authRequestTimeoutMs = 10_000;

type PasswordLoginOperation = operations["auth.password.login"];
type PasswordRegisterOperation = operations["auth.password.register"];
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
export type PasswordRegisterData = PasswordRegisterEnvelope["data"];
export type CurrentUserData = CurrentUserEnvelope["data"];

export async function registerWithPassword(
  input: PasswordRegisterInput,
): Promise<ApiResult<PasswordRegisterData>> {
  const client = createConfiguredLamaraApiClient();
  const request = client.POST(passwordRegisterPath, {
    body: input,
    cache: "no-store",
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readApiResult(request, AuthPasswordRegisterResponse);
}

export async function loginWithPassword(
  input: PasswordLoginInput,
): Promise<ApiResult<PasswordLoginData>> {
  const client = createConfiguredLamaraApiClient();
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
  const client = createConfiguredLamaraApiClient();
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
  const client = createConfiguredLamaraApiClient();
  const request = client.POST(logoutPath, {
    body: { refreshToken },
    cache: "no-store",
    parseAs: "text",
    signal: AbortSignal.timeout(authRequestTimeoutMs),
  });

  return readEmptyApiResult(request);
}
