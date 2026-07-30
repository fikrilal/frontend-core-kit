import { z } from "zod";

export const sessionRecordSchema = z.object({
  schemaVersion: z.literal(1),
  userId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accessTokenExpiresAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
  version: z.number().int().nonnegative(),
  refreshState: z.enum(["active", "refreshing"]),
  refreshStartedAt: z.number().int().positive().nullable(),
});

export type SessionRecord = Readonly<z.infer<typeof sessionRecordSchema>>;

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
