import "server-only";

import type { operations } from "@/contracts/lamara-api";
import {
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
const currentUserPath = "/v1/me" as const;
const logoutPath = "/v1/auth/logout" as const;
const authRequestTimeoutMs = 10_000;

type PasswordLoginOperation = operations["auth.password.login"];
type PasswordLoginEnvelope =
  PasswordLoginOperation["responses"][200]["content"]["application/json"];
type CurrentUserOperation = operations["users.me.get"];
type CurrentUserEnvelope =
  CurrentUserOperation["responses"][200]["content"]["application/json"];

export type PasswordLoginInput =
  PasswordLoginOperation["requestBody"]["content"]["application/json"];
export type PasswordLoginData = PasswordLoginEnvelope["data"];
export type CurrentUserData = CurrentUserEnvelope["data"];

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
