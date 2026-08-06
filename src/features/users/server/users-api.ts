import "server-only";

import type { operations } from "@/contracts/lamara-api";
import { UsersMePatchResponse } from "@/contracts/lamara-api/runtime";
import {
  createConfiguredLamaraApiClient,
  readApiResult,
  type ApiResult,
} from "@/server/api";

const currentUserPath = "/v1/me" as const;
const usersRequestTimeoutMs = 10_000;

type PatchMeOperation = operations["users.me.patch"];
type PatchMeEnvelope =
  PatchMeOperation["responses"][200]["content"]["application/json"];

export type PatchMeInput =
  PatchMeOperation["requestBody"]["content"]["application/json"];
export type PatchMeData = PatchMeEnvelope["data"];

export async function patchCurrentUser(
  input: PatchMeInput,
  accessToken: string,
): Promise<ApiResult<PatchMeData>> {
  const client = createConfiguredLamaraApiClient();
  const request = client.PATCH(currentUserPath, {
    body: input,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    parseAs: "text",
    signal: AbortSignal.timeout(usersRequestTimeoutMs),
  });

  return readApiResult(request, UsersMePatchResponse);
}
