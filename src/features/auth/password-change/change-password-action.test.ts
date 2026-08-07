import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePasswordAction } from "./change-password-action";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  clearSessionCookie: vi.fn(),
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

vi.mock("../server/auth-api", () => ({
  changePassword: mocks.changePassword,
}));

const initialState = { error: null, changed: false } as const;
const sessionId = "s".repeat(43);

function formData(): FormData {
  const data = new FormData();
  data.set("currentPassword", "correct horse battery staple");
  data.set("newPassword", "new-correct-password-10");
  data.set("newPasswordConfirmation", "new-correct-password-10");
  return data;
}

describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.changePassword.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(
      changePasswordAction(initialState, formData()),
    ).rejects.toThrow("redirected");

    expect(mocks.changePassword).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("changes the password through the current session access token", async () => {
    await expect(
      changePasswordAction(initialState, formData()),
    ).resolves.toEqual({ error: null, changed: true });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.changePassword).toHaveBeenCalledWith(
      {
        currentPassword: "correct horse battery staple",
        newPassword: "new-correct-password-10",
      },
      "access-token",
    );
  });

  it("rejects a mismatched confirmation without invoking the API", async () => {
    const data = formData();
    data.set("newPasswordConfirmation", "different-password");

    await expect(changePasswordAction(initialState, data)).resolves.toEqual({
      error: "invalidInput",
      changed: false,
    });

    expect(mocks.changePassword).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
  });

  it("maps an invalid current password to safe feedback", async () => {
    mocks.changePassword.mockResolvedValue(
      problemResult("AUTH_CURRENT_PASSWORD_INVALID", 400),
    );

    await expect(
      changePasswordAction(initialState, formData()),
    ).resolves.toEqual({ error: "invalidCurrentPassword", changed: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("maps a missing password to safe feedback", async () => {
    mocks.changePassword.mockResolvedValue(
      problemResult("AUTH_PASSWORD_NOT_SET", 400),
    );

    await expect(
      changePasswordAction(initialState, formData()),
    ).resolves.toEqual({ error: "passwordNotSet", changed: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("maps conflicts to safe retry feedback", async () => {
    mocks.changePassword.mockResolvedValue(problemResult("CONFLICT", 409));

    await expect(
      changePasswordAction(initialState, formData()),
    ).resolves.toEqual({ error: "conflict", changed: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.changePassword
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(
      changePasswordAction(initialState, formData()),
    ).resolves.toEqual({ error: null, changed: true });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.changePassword).toHaveBeenNthCalledWith(
      1,
      {
        currentPassword: "correct horse battery staple",
        newPassword: "new-correct-password-10",
      },
      "old-access-token",
    );
    expect(mocks.changePassword).toHaveBeenNthCalledWith(
      2,
      {
        currentPassword: "correct horse battery staple",
        newPassword: "new-correct-password-10",
      },
      "new-access-token",
    );
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.changePassword.mockResolvedValue(problemResult("UNAUTHORIZED", 401));

    await expect(
      changePasswordAction(initialState, formData()),
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
      changePasswordAction(initialState, formData()),
    ).resolves.toEqual({ error: "unavailable", changed: false });

    expect(mocks.changePassword).not.toHaveBeenCalled();
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
