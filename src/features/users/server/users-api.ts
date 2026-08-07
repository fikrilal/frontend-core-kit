import "server-only";

import type { operations } from "@/contracts/lamara-api";
import {
  UsersMePatchResponse,
  UsersMeSessionsListResponse,
} from "@/contracts/lamara-api/runtime";
import {
  createConfiguredLamaraApiClient,
  readApiResult,
  type ApiResult,
} from "@/server/api";

const currentUserPath = "/v1/me" as const;
const sessionsPath = "/v1/me/sessions" as const;
const usersRequestTimeoutMs = 10_000;

type PatchMeOperation = operations["users.me.patch"];
type PatchMeEnvelope =
  PatchMeOperation["responses"][200]["content"]["application/json"];
type SessionsListOperation = operations["users.me.sessions.list"];
type SessionsListEnvelope =
  SessionsListOperation["responses"][200]["content"]["application/json"];

export type PatchMeInput =
  PatchMeOperation["requestBody"]["content"]["application/json"];
export type PatchMeData = PatchMeEnvelope["data"];
export type SessionsListData = SessionsListEnvelope["data"];
export type SessionsListMeta = SessionsListEnvelope["meta"];

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

export async function listSessions(
  accessToken: string,
): Promise<ApiResult<SessionsListData>> {
  const client = createConfiguredLamaraApiClient();
  const request = client.GET(sessionsPath, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    parseAs: "text",
    signal: AbortSignal.timeout(usersRequestTimeoutMs),
  });

  return readApiResult(request, UsersMeSessionsListResponse);
}
