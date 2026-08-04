import { beforeEach, describe, expect, it, vi } from "vitest";

import { resendEmailVerificationAction } from "./email-verification-resend-action";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
  readSessionCookie: vi.fn(),
  resendEmailVerification: vi.fn(),
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
  resendEmailVerification: mocks.resendEmailVerification,
}));

const initialState = { error: null, sent: false } as const;
const sessionId = "s".repeat(43);

describe("resendEmailVerificationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.resendEmailVerification.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(
      resendEmailVerificationAction(initialState, new FormData()),
    ).rejects.toThrow("redirected");

    expect(mocks.resendEmailVerification).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("resends through the current session access token", async () => {
    await expect(
      resendEmailVerificationAction(initialState, new FormData()),
    ).resolves.toEqual({ error: null, sent: true });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.resendEmailVerification).toHaveBeenCalledWith("access-token");
  });

  it("maps rate limiting to safe retry guidance", async () => {
    mocks.resendEmailVerification.mockResolvedValue(
      problemResult("RATE_LIMITED", 429),
    );

    await expect(
      resendEmailVerificationAction(initialState, new FormData()),
    ).resolves.toEqual({ error: "rateLimited", sent: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.resendEmailVerification
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(
      resendEmailVerificationAction(initialState, new FormData()),
    ).resolves.toEqual({ error: null, sent: true });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.resendEmailVerification).toHaveBeenNthCalledWith(
      1,
      "old-access-token",
    );
    expect(mocks.resendEmailVerification).toHaveBeenNthCalledWith(
      2,
      "new-access-token",
    );
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.resendEmailVerification.mockResolvedValue(
      problemResult("UNAUTHORIZED", 401),
    );

    await expect(
      resendEmailVerificationAction(initialState, new FormData()),
    ).rejects.toThrow("redirected");

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
      resendEmailVerificationAction(initialState, new FormData()),
    ).resolves.toEqual({ error: "unavailable", sent: false });

    expect(mocks.resendEmailVerification).not.toHaveBeenCalled();
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
