import { beforeEach, describe, expect, it, vi } from "vitest";

import { revokeSessionAction } from "./revoke-session-action";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
  readSessionCookie: vi.fn(),
  revokeSession: vi.fn(),
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
  revokeSession: mocks.revokeSession,
}));

const initialState = { error: null, revoked: false } as const;
const sessionId = "s".repeat(43);
const targetSessionId = "session-1";

function formData(): FormData {
  const data = new FormData();
  data.set("sessionId", targetSessionId);
  return data;
}

describe("revokeSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.revokeSession.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(revokeSessionAction(initialState, formData())).rejects.toThrow(
      "redirected",
    );

    expect(mocks.revokeSession).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("revokes through the current session access token", async () => {
    await expect(
      revokeSessionAction(initialState, formData()),
    ).resolves.toEqual({ error: null, revoked: true });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.revokeSession).toHaveBeenCalledWith(
      targetSessionId,
      "access-token",
    );
  });

  it("rejects a missing session id without invoking the API", async () => {
    const empty = new FormData();

    await expect(revokeSessionAction(initialState, empty)).resolves.toEqual({
      error: "invalidInput",
      revoked: false,
    });

    expect(mocks.revokeSession).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
  });

  it("maps a not-found session to safe feedback", async () => {
    mocks.revokeSession.mockResolvedValue(problemResult("NOT_FOUND", 404));

    await expect(
      revokeSessionAction(initialState, formData()),
    ).resolves.toEqual({ error: "notFound", revoked: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("maps validation failures to safe input feedback", async () => {
    mocks.revokeSession.mockResolvedValue(
      problemResult("VALIDATION_FAILED", 422),
    );

    await expect(
      revokeSessionAction(initialState, formData()),
    ).resolves.toEqual({ error: "invalidInput", revoked: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.revokeSession
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(
      revokeSessionAction(initialState, formData()),
    ).resolves.toEqual({ error: null, revoked: true });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.revokeSession).toHaveBeenNthCalledWith(
      1,
      targetSessionId,
      "old-access-token",
    );
    expect(mocks.revokeSession).toHaveBeenNthCalledWith(
      2,
      targetSessionId,
      "new-access-token",
    );
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.revokeSession.mockResolvedValue(problemResult("UNAUTHORIZED", 401));

    await expect(revokeSessionAction(initialState, formData())).rejects.toThrow(
      "redirected",
    );

    expect(mocks.clearSessionCookie).toHaveBeenCalledOnce();
    expect(mocks.sessionClear).toHaveBeenCalledWith(sessionId);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("returns unavailable when session access cannot be read", async () => {
    mocks.sessionGetAccess.mockResolvedValue({
      ok: false,
      reason: "unavailable",
    });

    await expect(
      revokeSessionAction(initialState, formData()),
    ).resolves.toEqual({ error: "unavailable", revoked: false });

    expect(mocks.revokeSession).not.toHaveBeenCalled();
  });
});

function successResult() {
  return {
    data: undefined,
    ok: true,
    status: 204,
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
