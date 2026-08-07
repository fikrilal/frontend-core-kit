import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestAccountDeletionAction } from "./request-account-deletion-action";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
  readSessionCookie: vi.fn(),
  revalidatePath: vi.fn(),
  requestAccountDeletion: vi.fn(),
  sessionClear: vi.fn(),
  sessionGetAccess: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
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
  requestAccountDeletion: mocks.requestAccountDeletion,
}));

const initialState = { error: null, requested: false } as const;
const sessionId = "s".repeat(43);

describe("requestAccountDeletionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.requestAccountDeletion.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(
      requestAccountDeletionAction(initialState, new FormData()),
    ).rejects.toThrow("redirected");

    expect(mocks.requestAccountDeletion).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("requests through the current session access token", async () => {
    await expect(
      requestAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: null, requested: true });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.requestAccountDeletion).toHaveBeenCalledWith("access-token");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/account-deletion");
  });

  it("maps a last-admin failure to safe feedback", async () => {
    mocks.requestAccountDeletion.mockResolvedValue(
      problemResult("USERS_CANNOT_DELETE_LAST_ADMIN", 409),
    );

    await expect(
      requestAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: "lastAdmin", requested: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("maps conflicts to safe retry feedback", async () => {
    mocks.requestAccountDeletion.mockResolvedValue(
      problemResult("CONFLICT", 409),
    );

    await expect(
      requestAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: "conflict", requested: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.requestAccountDeletion
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(
      requestAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: null, requested: true });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.requestAccountDeletion).toHaveBeenNthCalledWith(
      1,
      "old-access-token",
    );
    expect(mocks.requestAccountDeletion).toHaveBeenNthCalledWith(
      2,
      "new-access-token",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/account-deletion");
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.requestAccountDeletion.mockResolvedValue(
      problemResult("UNAUTHORIZED", 401),
    );

    await expect(
      requestAccountDeletionAction(initialState, new FormData()),
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
      requestAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: "unavailable", requested: false });

    expect(mocks.requestAccountDeletion).not.toHaveBeenCalled();
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
