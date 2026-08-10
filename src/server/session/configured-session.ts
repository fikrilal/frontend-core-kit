import "server-only";

import { AuthRefreshResponse } from "@/contracts/example-api/runtime";
import {
  createConfiguredExampleApiClient,
  readApiResult,
  type ApiResult,
} from "@/server/api";
import { readSessionConfig } from "@/server/config/env";

import { MemorySessionStore } from "./memory-session-store";
import { SessionService, type RefreshedSessionData } from "./session-service";

const refreshPath = "/v1/auth/refresh" as const;
const refreshTimeoutMs = 10_000;

let configuredSessionService: SessionService | undefined;

export function getConfiguredSessionService(): SessionService {
  if (configuredSessionService) {
    return configuredSessionService;
  }

  const config = readSessionConfig();
  configuredSessionService = new SessionService({
    store: new MemorySessionStore(),
    sessionTtlMs: config.sessionTtlSeconds * 1000,
    refresh: refreshApiSession,
  });
  return configuredSessionService;
}

async function refreshApiSession(
  refreshToken: string,
): Promise<ApiResult<RefreshedSessionData>> {
  const client = createConfiguredExampleApiClient();
  const request = client.POST(refreshPath, {
    body: { refreshToken },
    cache: "no-store",
    parseAs: "text",
    signal: AbortSignal.timeout(refreshTimeoutMs),
  });

  return readApiResult(request, AuthRefreshResponse);
}
