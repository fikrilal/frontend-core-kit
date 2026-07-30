import { describe, expect, it, vi } from "vitest";

import type { ApiResult } from "@/server/api";

import { MemorySessionStore } from "./memory-session-store";
import { SessionService, type RefreshedSessionData } from "./session-service";

const now = Date.parse("2026-07-30T00:00:00.000Z");
const sessionId = "s".repeat(43);
const sessionTtlMs = 30 * 24 * 60 * 60 * 1000;

describe("SessionService", () => {
  it("stores tokens server-side and returns an unexpired access token", async () => {
    const refresh = vi.fn<() => Promise<ApiResult<RefreshedSessionData>>>();
    const store = new MemorySessionStore(() => now);
    const service = createService(store, refresh);

    const established = await service.establish({
      userId: "user-id",
      accessToken: jwtExpiringIn(5 * 60),
      refreshToken: "refresh-token",
    });
    const access = await service.getAccess(established.sessionId);

    expect(established).toEqual({
      sessionId,
      expiresAt: now + sessionTtlMs,
    });
    expect(access).toMatchObject({
      ok: true,
      session: {
        userId: "user-id",
        refreshToken: "refresh-token",
        version: 0,
        refreshState: "active",
      },
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("rotates both tokens once when concurrent requests need a refresh", async () => {
    let resolveRefresh:
      ((result: ApiResult<RefreshedSessionData>) => void) | undefined;
    const refresh = vi.fn(
      () =>
        new Promise<ApiResult<RefreshedSessionData>>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const store = new MemorySessionStore(() => now);
    const service = createService(store, refresh);
    await service.establish({
      userId: "user-id",
      accessToken: jwtExpiringIn(20),
      refreshToken: "old-refresh-token",
    });

    const first = service.getAccess(sessionId);
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    const second = service.getAccess(sessionId);
    resolveRefresh?.(refreshSuccess());

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toMatchObject({
      ok: true,
      session: {
        refreshToken: "new-refresh-token",
        version: 1,
        refreshState: "active",
      },
    });
    expect(secondResult).toMatchObject({
      ok: true,
      session: {
        refreshToken: "new-refresh-token",
        version: 1,
      },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("restores the old session after a definite transient API response", async () => {
    const refresh = vi.fn(() =>
      Promise.resolve<ApiResult<RefreshedSessionData>>({
        ok: false,
        failure: { kind: "network", message: "not used for classification" },
        status: 503,
        traceId: "trace-id",
      }),
    );
    const store = new MemorySessionStore(() => now);
    const service = createService(store, refresh);
    await service.establish({
      userId: "user-id",
      accessToken: jwtExpiringIn(20),
      refreshToken: "refresh-token",
    });

    const result = await service.getAccess(sessionId);

    expect(result).toEqual({ ok: false, reason: "unavailable" });
    expect(await store.read(sessionId)).toMatchObject({
      refreshState: "active",
      refreshToken: "refresh-token",
      version: 0,
    });
  });

  it.each([
    {
      name: "an unauthorized refresh",
      result: {
        ok: false,
        failure: {
          kind: "problem",
          problem: {
            type: "about:blank",
            title: "Unauthorized",
            status: 401,
            code: "AUTH_INVALID_REFRESH_TOKEN",
            traceId: "trace-id",
          },
        },
        status: 401,
        traceId: "trace-id",
      } satisfies ApiResult<RefreshedSessionData>,
    },
    {
      name: "an unknown network outcome",
      result: {
        ok: false,
        failure: { kind: "network", message: "connection lost" },
        status: null,
        traceId: "trace-id",
      } satisfies ApiResult<RefreshedSessionData>,
    },
  ])("deletes the session after $name", async ({ result }) => {
    const store = new MemorySessionStore(() => now);
    const service = createService(store, () => Promise.resolve(result));
    await service.establish({
      userId: "user-id",
      accessToken: jwtExpiringIn(20),
      refreshToken: "refresh-token",
    });

    expect(await service.getAccess(sessionId)).toEqual({
      ok: false,
      reason: "missing",
    });
    expect(await store.read(sessionId)).toBeNull();
  });

  it("rejects invalid access tokens before persisting a session", async () => {
    const store = new MemorySessionStore(() => now);
    const service = createService(store, () =>
      Promise.resolve(refreshSuccess()),
    );

    await expect(
      service.establish({
        userId: "user-id",
        accessToken: "not-a-jwt",
        refreshToken: "refresh-token",
      }),
    ).rejects.toThrow("Backend returned an invalid access token.");
    expect(await store.read(sessionId)).toBeNull();
  });

  it("removes a session after its absolute expiry", async () => {
    let currentTime = now;
    const store = new MemorySessionStore(() => currentTime);
    const service = new SessionService({
      store,
      sessionTtlMs,
      refresh: () => Promise.resolve(refreshSuccess()),
      now: () => currentTime,
      createSessionId: () => sessionId,
    });
    await service.establish({
      userId: "user-id",
      accessToken: jwtExpiringIn(5 * 60),
      refreshToken: "refresh-token",
    });

    currentTime += sessionTtlMs + 1;

    expect(await service.read(sessionId)).toBeNull();
  });
});

function createService(
  store: MemorySessionStore,
  refresh: (refreshToken: string) => Promise<ApiResult<RefreshedSessionData>>,
): SessionService {
  return new SessionService({
    store,
    sessionTtlMs,
    refresh,
    now: () => now,
    createSessionId: () => sessionId,
    createLockOwner: () => crypto.randomUUID(),
  });
}

function refreshSuccess(): ApiResult<RefreshedSessionData> {
  return {
    ok: true,
    data: {
      accessToken: jwtExpiringIn(5 * 60),
      refreshToken: "new-refresh-token",
      user: {
        id: "user-id",
      },
    },
    status: 200,
    traceId: "trace-id",
  };
}

function jwtExpiringIn(seconds: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(now / 1000) + seconds }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}
