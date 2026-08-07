import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadSessions } from "./load-sessions";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  listSessions: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
  readSessionCookie: vi.fn(),
  sessionClear: vi.fn(),
  sessionGetAccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/session", () => ({
  clearSessionCookie: mocks.clearSessionCookie,
  getConfiguredSessionService: () => ({
    clear: mocks.sessionClear,
    getAccess: mocks.sessionGetAccess,
  }),
  readSessionCookie: mocks.readSessionCookie,
}));

vi.mock("../server/users-api", () => ({
  listSessions: mocks.listSessions,
}));

const sessionId = "s".repeat(43);
const sessions = [
  {
    createdAt: "2026-01-10T12:34:56.789Z",
    current: true,
    deviceId: "device-a",
    deviceName: "Dante's iPhone",
    expiresAt: "2026-02-10T12:34:56.789Z",
    id: "session-1",
    ip: "203.0.113.10",
    lastSeenAt: "2026-01-10T12:34:56.789Z",
    revokedAt: null,
    status: "active",
    userAgent: "Mozilla/5.0 (iPhone)",
  },
  {
    createdAt: "2026-01-05T08:00:00.000Z",
    current: false,
    deviceId: "device-b",
    deviceName: "Dante's MacBook",
    expiresAt: "2026-02-05T08:00:00.000Z",
    id: "session-2",
    ip: "198.51.100.7",
    lastSeenAt: "2026-01-08T20:15:00.000Z",
    revokedAt: "2026-01-09T09:30:00.000Z",
    status: "revoked",
    userAgent: "Mozilla/5.0 (Macintosh)",
  },
];

describe("loadSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.listSessions.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(loadSessions()).rejects.toThrow("redirected");

    expect(mocks.listSessions).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("loads sessions through the current session access token", async () => {
    await expect(loadSessions()).resolves.toEqual({
      ok: true,
      sessions,
    });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.listSessions).toHaveBeenCalledWith("access-token");
  });

  it("maps validation failures to safe input feedback", async () => {
    mocks.listSessions.mockResolvedValue(
      problemResult("VALIDATION_FAILED", 422),
    );

    await expect(loadSessions()).resolves.toEqual({
      ok: false,
      error: "invalidInput",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.listSessions
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(loadSessions()).resolves.toEqual({ ok: true, sessions });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.listSessions).toHaveBeenNthCalledWith(1, "old-access-token");
    expect(mocks.listSessions).toHaveBeenNthCalledWith(2, "new-access-token");
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.listSessions.mockResolvedValue(problemResult("UNAUTHORIZED", 401));

    await expect(loadSessions()).rejects.toThrow("redirected");

    expect(mocks.clearSessionCookie).toHaveBeenCalledOnce();
    expect(mocks.sessionClear).toHaveBeenCalledWith(sessionId);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("returns unavailable when session access cannot be read", async () => {
    mocks.sessionGetAccess.mockResolvedValue({
      ok: false,
      reason: "unavailable",
    });

    await expect(loadSessions()).resolves.toEqual({
      ok: false,
      error: "unavailable",
    });

    expect(mocks.listSessions).not.toHaveBeenCalled();
  });
});

function successResult() {
  return {
    data: sessions,
    ok: true,
    status: 200,
    traceId: "trace-id",
  } as const;
}

function problemResult(code: string, status: number) {
  return {
    failure: {
      kind: "problem",
      problem: {
        type: "about:blank",
        title: "Backend details must not become UI copy",
        status,
        code,
        traceId: "trace-id",
      },
    },
    ok: false,
    status,
    traceId: "trace-id",
  } as const;
}
