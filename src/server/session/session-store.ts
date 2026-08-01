export type SessionRecord = Readonly<{
  schemaVersion: 1;
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  expiresAt: number;
  version: number;
  refreshState: "active" | "refreshing";
  refreshStartedAt: number | null;
}>;

export type SessionState = SessionRecord["refreshState"];

export interface SessionStore {
  create(
    sessionId: string,
    record: SessionRecord,
    ttlMs: number,
  ): Promise<boolean>;
  read(sessionId: string): Promise<SessionRecord | null>;
  compareAndSet(
    sessionId: string,
    expectedVersion: number,
    expectedState: SessionState,
    record: SessionRecord,
    ttlMs: number,
  ): Promise<boolean>;
  delete(sessionId: string): Promise<void>;
  acquireRefreshLock(
    sessionId: string,
    owner: string,
    ttlMs: number,
  ): Promise<boolean>;
  releaseRefreshLock(sessionId: string, owner: string): Promise<void>;
}
