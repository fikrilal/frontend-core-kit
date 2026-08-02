import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadAuthenticatedUser } from "./load-authenticated-user";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  getCurrentUser: vi.fn(),
  readSessionCookie: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
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

vi.mock("../server/auth-api", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

describe("loadAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue("s".repeat(43));
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "old-access-token",
    });
  });

  it("does not refresh a forbidden authenticated read", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      ok: false,
      status: 403,
    });

    await expect(loadAuthenticatedUser()).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(mocks.sessionGetAccess).toHaveBeenCalledOnce();
    expect(mocks.sessionGetAccess).toHaveBeenCalledWith("s".repeat(43), {
      forceRefresh: false,
    });
  });

  it("refreshes and retries once after an unauthorized read", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({
        ok: true,
        accessToken: "old-access-token",
      })
      .mockResolvedValueOnce({
        ok: true,
        accessToken: "new-access-token",
      });
    mocks.getCurrentUser
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { email: "user@example.com" },
      });

    await expect(loadAuthenticatedUser()).resolves.toEqual({
      ok: true,
      user: { email: "user@example.com" },
    });
    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, "s".repeat(43), {
      forceRefresh: true,
    });
    expect(mocks.getCurrentUser).toHaveBeenCalledTimes(2);
  });
});
