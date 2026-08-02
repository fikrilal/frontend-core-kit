import { beforeEach, describe, expect, it, vi } from "vitest";

import { establishAuthenticatedSession } from "./establish-authenticated-session";

const mocks = vi.hoisted(() => ({
  clear: vi.fn(),
  establish: vi.fn(),
  logoutRemoteSession: vi.fn(),
  readSessionCookie: vi.fn(),
  writeSessionCookie: vi.fn(),
}));

vi.mock("@/server/session", () => ({
  getConfiguredSessionService: () => ({
    clear: mocks.clear,
    establish: mocks.establish,
  }),
  readSessionCookie: mocks.readSessionCookie,
  writeSessionCookie: mocks.writeSessionCookie,
}));

vi.mock("../server/auth-api", () => ({
  logoutRemoteSession: mocks.logoutRemoteSession,
}));

const input = {
  accessToken: "access-token",
  refreshToken: "new-refresh-token",
  userId: "user-id",
};
const established = {
  expiresAt: Date.parse("2026-08-01T01:00:00.000Z"),
  sessionId: "s".repeat(43),
};

describe("establishAuthenticatedSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(null);
    mocks.establish.mockResolvedValue(established);
    mocks.writeSessionCookie.mockResolvedValue(undefined);
    mocks.clear.mockResolvedValue(null);
    mocks.logoutRemoteSession.mockResolvedValue({
      ok: true,
      data: undefined,
      status: 204,
      traceId: "trace-id",
    });
  });

  it("writes the new session without exposing its tokens", async () => {
    await expect(establishAuthenticatedSession(input)).resolves.toBe(true);

    expect(mocks.establish).toHaveBeenCalledWith(input);
    expect(mocks.writeSessionCookie).toHaveBeenCalledWith(established);
    expect(mocks.logoutRemoteSession).not.toHaveBeenCalled();
  });

  it("clears a newly created local session and revokes its remote session when the cookie write fails", async () => {
    mocks.writeSessionCookie.mockRejectedValue(new Error("cookie failure"));

    await expect(establishAuthenticatedSession(input)).resolves.toBe(false);

    expect(mocks.clear).toHaveBeenCalledWith(established.sessionId);
    expect(mocks.logoutRemoteSession).toHaveBeenCalledWith(input.refreshToken);
  });

  it("revokes the previous remote session after replacing its local cookie", async () => {
    const previousSessionId = "p".repeat(43);
    mocks.readSessionCookie.mockResolvedValue(previousSessionId);
    mocks.clear.mockResolvedValue({ refreshToken: "old-refresh-token" });

    await expect(establishAuthenticatedSession(input)).resolves.toBe(true);

    expect(mocks.clear).toHaveBeenCalledWith(previousSessionId);
    expect(mocks.logoutRemoteSession).toHaveBeenCalledWith("old-refresh-token");
  });
});
