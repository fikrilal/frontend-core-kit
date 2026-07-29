import "server-only";

import type { operations } from "@/contracts/lamara-api";
import { AuthResultWithMeDto } from "@/contracts/lamara-api/runtime";
import {
  createConfiguredLamaraApiClient,
  readApiResult,
  type ApiResult,
} from "@/server/api";

const passwordLoginPath = "/v1/auth/password/login" as const;
const passwordLoginTimeoutMs = 10_000;

type PasswordLoginOperation = operations["auth.password.login"];
type PasswordLoginEnvelope =
  PasswordLoginOperation["responses"][200]["content"]["application/json"];

export type PasswordLoginInput =
  PasswordLoginOperation["requestBody"]["content"]["application/json"];
export type PasswordLoginData = PasswordLoginEnvelope["data"];

export async function loginWithPassword(
  input: PasswordLoginInput,
): Promise<ApiResult<PasswordLoginData>> {
  const client = createConfiguredLamaraApiClient();
  const request = client.POST(passwordLoginPath, {
    body: input,
    cache: "no-store",
    // Keep parsing and validation inside the explicit Zod boundary below.
    parseAs: "text",
    signal: AbortSignal.timeout(passwordLoginTimeoutMs),
  });

  return readApiResult(request, AuthResultWithMeDto);
}
