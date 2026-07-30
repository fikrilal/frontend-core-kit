import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import { z } from "zod";

import type { ApiResult } from "@/server/api";

import type { SessionRecord, SessionStore } from "./session-store";

const accessTokenRefreshSkewMs = 30_000;
const refreshLockTtlMs = 15_000;
const refreshWaitMs = 10_000;
const refreshPollMs = 50;

export type EstablishedSession = Readonly<{
  sessionId: string;
  expiresAt: number;
}>;

export type RefreshedSessionData = Readonly<{
  accessToken: string;
  refreshToken: string;
  user: Readonly<{
    id: string;
  }>;
}>;

export type SessionAccessResult =
  | Readonly<{
      ok: true;
      accessToken: string;
      session: SessionRecord;
    }>
  | Readonly<{
      ok: false;
      reason: "missing" | "unavailable";
    }>;

type EstablishSessionInput = Readonly<{
  userId: string;
  accessToken: string;
  refreshToken: string;
}>;

type SessionServiceDependencies = Readonly<{
  store: SessionStore;
  sessionTtlMs: number;
  refresh: (refreshToken: string) => Promise<ApiResult<RefreshedSessionData>>;
  now?: () => number;
  createSessionId?: () => string;
  createLockOwner?: () => string;
  sleep?: (durationMs: number) => Promise<void>;
}>;

export class SessionService {
  private readonly now: () => number;
  private readonly createSessionId: () => string;
  private readonly createLockOwner: () => string;
  private readonly sleep: (durationMs: number) => Promise<void>;

  constructor(private readonly dependencies: SessionServiceDependencies) {
    this.now = dependencies.now ?? Date.now;
    this.createSessionId =
      dependencies.createSessionId ??
      (() => randomBytes(32).toString("base64url"));
    this.createLockOwner = dependencies.createLockOwner ?? randomUUID;
    this.sleep =
      dependencies.sleep ??
      ((durationMs) =>
        new Promise((resolve) => {
          setTimeout(resolve, durationMs);
        }));
  }

  async establish(input: EstablishSessionInput): Promise<EstablishedSession> {
    const now = this.now();
    const accessTokenExpiresAt = readAccessTokenExpiresAt(input.accessToken);
    if (accessTokenExpiresAt === null || accessTokenExpiresAt <= now) {
      throw new TypeError("Backend returned an invalid access token.");
    }

    const expiresAt = now + this.dependencies.sessionTtlMs;
    const record: SessionRecord = {
      schemaVersion: 1,
      userId: input.userId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt,
      expiresAt,
      version: 0,
      refreshState: "active",
      refreshStartedAt: null,
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const sessionId = this.createSessionId();
      const created = await this.dependencies.store.create(
        sessionId,
        record,
        this.dependencies.sessionTtlMs,
      );
      if (created) {
        return { sessionId, expiresAt };
      }
    }

    throw new Error("Unable to allocate a unique session identifier.");
  }

  async read(sessionId: string): Promise<SessionRecord | null> {
    const record = await this.dependencies.store.read(sessionId);
    if (!record) {
      return null;
    }

    if (record.expiresAt <= this.now()) {
      await this.dependencies.store.delete(sessionId);
      return null;
    }

    return record;
  }

  async clear(sessionId: string): Promise<SessionRecord | null> {
    const record = await this.dependencies.store.read(sessionId);
    await this.dependencies.store.delete(sessionId);
    return record;
  }

  async getAccess(
    sessionId: string,
    options: Readonly<{ forceRefresh?: boolean }> = {},
  ): Promise<SessionAccessResult> {
    const observed = await this.read(sessionId);
    if (!observed) {
      return { ok: false, reason: "missing" };
    }
    if (observed.refreshState === "refreshing") {
      return this.waitForRefresh(sessionId, observed.version, true);
    }

    if (
      !options.forceRefresh &&
      observed.accessTokenExpiresAt > this.now() + accessTokenRefreshSkewMs
    ) {
      return {
        ok: true,
        accessToken: observed.accessToken,
        session: observed,
      };
    }

    return this.refreshWithLock(sessionId, observed, options.forceRefresh);
  }

  private async refreshWithLock(
    sessionId: string,
    observed: SessionRecord,
    forceRefresh = false,
  ): Promise<SessionAccessResult> {
    const lockOwner = this.createLockOwner();
    const acquired = await this.dependencies.store.acquireRefreshLock(
      sessionId,
      lockOwner,
      refreshLockTtlMs,
    );

    if (!acquired) {
      return this.waitForRefresh(sessionId, observed.version);
    }

    try {
      const current = await this.read(sessionId);
      if (!current) {
        return { ok: false, reason: "missing" };
      }

      if (current.refreshState === "refreshing") {
        await this.dependencies.store.delete(sessionId);
        return { ok: false, reason: "missing" };
      }

      if (
        current.version !== observed.version ||
        (!forceRefresh &&
          current.accessTokenExpiresAt > this.now() + accessTokenRefreshSkewMs)
      ) {
        return {
          ok: true,
          accessToken: current.accessToken,
          session: current,
        };
      }

      const refreshing: SessionRecord = {
        ...current,
        refreshState: "refreshing",
        refreshStartedAt: this.now(),
      };
      const markedRefreshing = await this.dependencies.store.compareAndSet(
        sessionId,
        current.version,
        "active",
        refreshing,
        this.remainingTtl(refreshing),
      );
      if (!markedRefreshing) {
        return await this.waitForRefresh(sessionId, current.version);
      }

      const result = await this.dependencies.refresh(current.refreshToken);
      if (!result.ok) {
        return await this.handleRefreshFailure(sessionId, refreshing, result);
      }

      return await this.persistRefreshSuccess(
        sessionId,
        refreshing,
        result.data,
      );
    } finally {
      try {
        await this.dependencies.store.releaseRefreshLock(sessionId, lockOwner);
      } catch {
        // The bounded lock expires even if cleanup cannot complete.
      }
    }
  }

  private async persistRefreshSuccess(
    sessionId: string,
    refreshing: SessionRecord,
    data: RefreshedSessionData,
  ): Promise<SessionAccessResult> {
    const accessTokenExpiresAt = readAccessTokenExpiresAt(data.accessToken);
    if (
      accessTokenExpiresAt === null ||
      accessTokenExpiresAt <= this.now() ||
      data.user.id !== refreshing.userId
    ) {
      await this.dependencies.store.delete(sessionId);
      return { ok: false, reason: "missing" };
    }

    const updated: SessionRecord = {
      ...refreshing,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpiresAt,
      version: refreshing.version + 1,
      refreshState: "active",
      refreshStartedAt: null,
    };
    const persisted = await this.dependencies.store.compareAndSet(
      sessionId,
      refreshing.version,
      "refreshing",
      updated,
      this.remainingTtl(updated),
    );
    if (!persisted) {
      await this.dependencies.store.delete(sessionId);
      return { ok: false, reason: "missing" };
    }

    return {
      ok: true,
      accessToken: updated.accessToken,
      session: updated,
    };
  }

  private async handleRefreshFailure(
    sessionId: string,
    refreshing: SessionRecord,
    result: Exclude<ApiResult<RefreshedSessionData>, { ok: true }>,
  ): Promise<SessionAccessResult> {
    const definiteTransient =
      result.status === 429 || (result.status !== null && result.status >= 500);

    if (definiteTransient) {
      const restored: SessionRecord = {
        ...refreshing,
        refreshState: "active",
        refreshStartedAt: null,
      };
      await this.dependencies.store.compareAndSet(
        sessionId,
        refreshing.version,
        "refreshing",
        restored,
        this.remainingTtl(restored),
      );
      return { ok: false, reason: "unavailable" };
    }

    await this.dependencies.store.delete(sessionId);
    return { ok: false, reason: "missing" };
  }

  private async waitForRefresh(
    sessionId: string,
    observedVersion: number,
    initiallyRefreshing = false,
  ): Promise<SessionAccessResult> {
    const deadline = this.now() + refreshWaitMs;
    let sawRefreshing = initiallyRefreshing;

    while (this.now() < deadline) {
      await this.sleep(refreshPollMs);
      const current = await this.read(sessionId);
      if (!current) {
        return { ok: false, reason: "missing" };
      }
      if (
        current.refreshState === "active" &&
        current.version !== observedVersion
      ) {
        return {
          ok: true,
          accessToken: current.accessToken,
          session: current,
        };
      }
      if (current.refreshState === "refreshing") {
        sawRefreshing = true;
        continue;
      }
      if (sawRefreshing && current.version === observedVersion) {
        return { ok: false, reason: "unavailable" };
      }
    }

    return { ok: false, reason: "unavailable" };
  }

  private remainingTtl(record: SessionRecord): number {
    return Math.max(1, record.expiresAt - this.now());
  }
}

const accessTokenPayloadSchema = z.object({
  exp: z.number().int().positive(),
});

function readAccessTokenExpiresAt(accessToken: string): number | null {
  const payload = accessToken.split(".")[1];
  if (!payload) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    const parsed = accessTokenPayloadSchema.safeParse(decoded);
    return parsed.success ? parsed.data.exp * 1000 : null;
  } catch {
    return null;
  }
}
