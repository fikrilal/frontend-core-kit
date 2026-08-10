import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeProfileImageUploadAction } from "./complete-upload-action";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  completeProfileImageUpload: vi.fn(),
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
  completeProfileImageUpload: mocks.completeProfileImageUpload,
}));

const initialState = { error: null, completed: false } as const;
const sessionId = "s".repeat(43);
const fileId = "file-id";

function formData(): FormData {
  const data = new FormData();
  data.set("fileId", fileId);
  return data;
}

describe("completeProfileImageUploadAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.completeProfileImageUpload.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(
      completeProfileImageUploadAction(initialState, formData()),
    ).rejects.toThrow("redirected");

    expect(mocks.completeProfileImageUpload).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("completes through the current session access token", async () => {
    await expect(
      completeProfileImageUploadAction(initialState, formData()),
    ).resolves.toEqual({ error: null, completed: true });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.completeProfileImageUpload).toHaveBeenCalledWith(
      { fileId },
      "access-token",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/profile");
  });

  it("rejects a missing file id without invoking the API", async () => {
    await expect(
      completeProfileImageUploadAction(initialState, new FormData()),
    ).resolves.toEqual({ error: "mismatch", completed: false });

    expect(mocks.completeProfileImageUpload).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
  });

  it("maps a not-found failure to safe feedback", async () => {
    mocks.completeProfileImageUpload.mockResolvedValue(
      problemResult("NOT_FOUND", 404),
    );

    await expect(
      completeProfileImageUploadAction(initialState, formData()),
    ).resolves.toEqual({ error: "notFound", completed: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("maps a size mismatch to safe feedback", async () => {
    mocks.completeProfileImageUpload.mockResolvedValue(
      problemResult("USERS_PROFILE_IMAGE_SIZE_MISMATCH", 422),
    );

    await expect(
      completeProfileImageUploadAction(initialState, formData()),
    ).resolves.toEqual({ error: "mismatch", completed: false });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.completeProfileImageUpload
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(
      completeProfileImageUploadAction(initialState, formData()),
    ).resolves.toEqual({ error: null, completed: true });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.completeProfileImageUpload).toHaveBeenNthCalledWith(
      1,
      { fileId },
      "old-access-token",
    );
    expect(mocks.completeProfileImageUpload).toHaveBeenNthCalledWith(
      2,
      { fileId },
      "new-access-token",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/profile");
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.completeProfileImageUpload.mockResolvedValue(
      problemResult("UNAUTHORIZED", 401),
    );

    await expect(
      completeProfileImageUploadAction(initialState, formData()),
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
      completeProfileImageUploadAction(initialState, formData()),
    ).resolves.toEqual({ error: "unavailable", completed: false });

    expect(mocks.completeProfileImageUpload).not.toHaveBeenCalled();
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
