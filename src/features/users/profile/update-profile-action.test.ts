import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateProfileAction } from "./update-profile-action";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  patchCurrentUser: vi.fn(),
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
  patchCurrentUser: mocks.patchCurrentUser,
}));

const initialState = { error: null, saved: false, profile: null } as const;
const sessionId = "s".repeat(43);
const currentUser = {
  accountDeletion: null,
  authMethods: ["PASSWORD"],
  email: "dante@example.com",
  emailVerified: true,
  id: "user-id",
  profile: {
    displayName: "Dante",
    familyName: null,
    givenName: "Dante",
    profileImageFileId: null,
  },
  roles: ["USER"],
};

function formData(
  overrides: Record<string, string | undefined> = {},
): FormData {
  const data = new FormData();
  const values: Record<string, string | undefined> = {
    displayName: "Dante",
    givenName: "",
    familyName: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      data.set(key, value);
    }
  }
  return data;
}

describe("updateProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.patchCurrentUser.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(updateProfileAction(initialState, formData())).rejects.toThrow(
      "redirected",
    );

    expect(mocks.patchCurrentUser).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("patches through the current session access token", async () => {
    await expect(
      updateProfileAction(initialState, formData()),
    ).resolves.toEqual({
      error: null,
      saved: true,
      profile: {
        displayName: "Dante",
        givenName: "Dante",
        familyName: null,
      },
    });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.patchCurrentUser).toHaveBeenCalledWith(
      {
        profile: {
          displayName: "Dante",
          givenName: undefined,
          familyName: undefined,
        },
      },
      "access-token",
    );
  });

  it("maps validation failures to safe input feedback", async () => {
    mocks.patchCurrentUser.mockResolvedValue(
      problemResult("VALIDATION_FAILED", 422),
    );

    await expect(
      updateProfileAction(initialState, formData()),
    ).resolves.toEqual({ error: "invalidInput", saved: false, profile: null });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("maps conflicts to safe retry feedback", async () => {
    mocks.patchCurrentUser.mockResolvedValue(problemResult("CONFLICT", 409));

    await expect(
      updateProfileAction(initialState, formData()),
    ).resolves.toEqual({ error: "conflict", saved: false, profile: null });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.patchCurrentUser
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(
      updateProfileAction(initialState, formData()),
    ).resolves.toEqual({
      error: null,
      saved: true,
      profile: {
        displayName: "Dante",
        givenName: "Dante",
        familyName: null,
      },
    });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.patchCurrentUser).toHaveBeenNthCalledWith(
      1,
      {
        profile: {
          displayName: "Dante",
          givenName: undefined,
          familyName: undefined,
        },
      },
      "old-access-token",
    );
    expect(mocks.patchCurrentUser).toHaveBeenNthCalledWith(
      2,
      {
        profile: {
          displayName: "Dante",
          givenName: undefined,
          familyName: undefined,
        },
      },
      "new-access-token",
    );
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.patchCurrentUser.mockResolvedValue(
      problemResult("UNAUTHORIZED", 401),
    );

    await expect(updateProfileAction(initialState, formData())).rejects.toThrow(
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
      updateProfileAction(initialState, formData()),
    ).resolves.toEqual({
      error: "unavailable",
      saved: false,
      profile: null,
    });

    expect(mocks.patchCurrentUser).not.toHaveBeenCalled();
  });
});

function successResult() {
  return {
    data: currentUser,
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
