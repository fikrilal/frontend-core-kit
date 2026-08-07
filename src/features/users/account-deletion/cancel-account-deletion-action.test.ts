import { beforeEach, describe, expect, it, vi } from "vitest";

import { cancelAccountDeletionAction } from "./cancel-account-deletion-action";

const mocks = vi.hoisted(() => ({
  cancelAccountDeletion: vi.fn(),
  clearSessionCookie: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
  readSessionCookie: vi.fn(),
  revalidatePath: vi.fn(),
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
  cancelAccountDeletion: mocks.cancelAccountDeletion,
}));

const initialState = { error: null, cancelled: false } as const;
const sessionId = "s".repeat(43);

describe("cancelAccountDeletionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.cancelAccountDeletion.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(
      cancelAccountDeletionAction(initialState, new FormData()),
    ).rejects.toThrow("redirected");

    expect(mocks.cancelAccountDeletion).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("cancels through the current session access token", async () => {
    await expect(
      cancelAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: null, cancelled: true });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.cancelAccountDeletion).toHaveBeenCalledWith("access-token");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/account-deletion");
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.cancelAccountDeletion
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(
      cancelAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: null, cancelled: true });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.cancelAccountDeletion).toHaveBeenNthCalledWith(
      1,
      "old-access-token",
    );
    expect(mocks.cancelAccountDeletion).toHaveBeenNthCalledWith(
      2,
      "new-access-token",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/account-deletion");
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.cancelAccountDeletion.mockResolvedValue(
      problemResult("UNAUTHORIZED", 401),
    );

    await expect(
      cancelAccountDeletionAction(initialState, new FormData()),
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
      cancelAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: "unavailable", cancelled: false });

    expect(mocks.cancelAccountDeletion).not.toHaveBeenCalled();
  });

  it("maps unexpected failures to safe feedback", async () => {
    mocks.cancelAccountDeletion.mockResolvedValue(
      problemResult("INTERNAL", 500),
    );

    await expect(
      cancelAccountDeletionAction(initialState, new FormData()),
    ).resolves.toEqual({ error: "unavailable", cancelled: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
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
