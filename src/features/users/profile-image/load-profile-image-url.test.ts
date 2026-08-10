import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadProfileImageUrl } from "./load-profile-image-url";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  getProfileImageUrl: vi.fn(),
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
  getProfileImageUrl: mocks.getProfileImageUrl,
}));

const sessionId = "s".repeat(43);
const imageUrl = {
  expiresAt: "2026-01-10T12:40:00.000Z",
  url: "https://r2.example.com/render",
};

describe("loadProfileImageUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.getProfileImageUrl.mockResolvedValue(successResult(imageUrl));
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(loadProfileImageUrl()).rejects.toThrow("redirected");

    expect(mocks.getProfileImageUrl).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("loads the profile image url through the current session access token", async () => {
    await expect(loadProfileImageUrl()).resolves.toEqual({
      ok: true,
      imageUrl,
    });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.getProfileImageUrl).toHaveBeenCalledWith("access-token");
  });

  it("returns null when no profile image is set", async () => {
    mocks.getProfileImageUrl.mockResolvedValue(successResult(null));

    await expect(loadProfileImageUrl()).resolves.toEqual({
      ok: true,
      imageUrl: null,
    });
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.getProfileImageUrl
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult(imageUrl));

    await expect(loadProfileImageUrl()).resolves.toEqual({
      ok: true,
      imageUrl,
    });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.getProfileImageUrl).toHaveBeenNthCalledWith(
      1,
      "old-access-token",
    );
    expect(mocks.getProfileImageUrl).toHaveBeenNthCalledWith(
      2,
      "new-access-token",
    );
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.getProfileImageUrl.mockResolvedValue(
      problemResult("UNAUTHORIZED", 401),
    );

    await expect(loadProfileImageUrl()).rejects.toThrow("redirected");

    expect(mocks.clearSessionCookie).toHaveBeenCalledOnce();
    expect(mocks.sessionClear).toHaveBeenCalledWith(sessionId);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("returns unavailable when session access cannot be read", async () => {
    mocks.sessionGetAccess.mockResolvedValue({
      ok: false,
      reason: "unavailable",
    });

    await expect(loadProfileImageUrl()).resolves.toEqual({
      ok: false,
      error: "unavailable",
    });

    expect(mocks.getProfileImageUrl).not.toHaveBeenCalled();
  });

  it("maps unexpected failures to unavailable", async () => {
    mocks.getProfileImageUrl.mockResolvedValue(problemResult("INTERNAL", 500));

    await expect(loadProfileImageUrl()).resolves.toEqual({
      ok: false,
      error: "unavailable",
    });
  });
});

function successResult(data: typeof imageUrl | null) {
  return {
    data,
    ok: true,
    status: data === null ? 204 : 200,
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
