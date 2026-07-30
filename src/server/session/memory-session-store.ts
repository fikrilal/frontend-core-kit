import "server-only";

import type {
  SessionRecord,
  SessionState,
  SessionStore,
} from "./session-store";

interface StoredSession {
  record: SessionRecord;
  expiresAt: number;
}

interface StoredLock {
  owner: string;
  expiresAt: number;
}

export class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly locks = new Map<string, StoredLock>();

  constructor(private readonly now: () => number = Date.now) {}

  create(
    sessionId: string,
    record: SessionRecord,
    ttlMs: number,
  ): Promise<boolean> {
    this.removeExpiredSession(sessionId);
    if (this.sessions.has(sessionId)) {
      return Promise.resolve(false);
    }

    this.sessions.set(sessionId, {
      record,
      expiresAt: this.now() + ttlMs,
    });
    return Promise.resolve(true);
  }

  read(sessionId: string): Promise<SessionRecord | null> {
    this.removeExpiredSession(sessionId);
    return Promise.resolve(this.sessions.get(sessionId)?.record ?? null);
  }

  compareAndSet(
    sessionId: string,
    expectedVersion: number,
    expectedState: SessionState,
    record: SessionRecord,
    ttlMs: number,
  ): Promise<boolean> {
    this.removeExpiredSession(sessionId);
    const current = this.sessions.get(sessionId);
    if (
      current?.record.version !== expectedVersion ||
      current.record.refreshState !== expectedState
    ) {
      return Promise.resolve(false);
    }

    this.sessions.set(sessionId, {
      record,
      expiresAt: this.now() + ttlMs,
    });
    return Promise.resolve(true);
  }

  delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    return Promise.resolve();
  }

  acquireRefreshLock(
    sessionId: string,
    owner: string,
    ttlMs: number,
  ): Promise<boolean> {
    this.removeExpiredLock(sessionId);
    if (this.locks.has(sessionId)) {
      return Promise.resolve(false);
    }

    this.locks.set(sessionId, {
      owner,
      expiresAt: this.now() + ttlMs,
    });
    return Promise.resolve(true);
  }

  releaseRefreshLock(sessionId: string, owner: string): Promise<void> {
    if (this.locks.get(sessionId)?.owner === owner) {
      this.locks.delete(sessionId);
    }
    return Promise.resolve();
  }

  private removeExpiredSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session && session.expiresAt <= this.now()) {
      this.sessions.delete(sessionId);
    }
  }

  private removeExpiredLock(sessionId: string) {
    const lock = this.locks.get(sessionId);
    if (lock && lock.expiresAt <= this.now()) {
      this.locks.delete(sessionId);
    }
  }
}
