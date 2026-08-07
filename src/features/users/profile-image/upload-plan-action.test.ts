import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProfileImageUploadPlanAction } from "./upload-plan-action";

const mocks = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  createProfileImageUploadPlan: vi.fn(),
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
  createProfileImageUploadPlan: mocks.createProfileImageUploadPlan,
}));

const initialState = { error: null, plan: null } as const;
const sessionId = "s".repeat(43);

function formData(): FormData {
  const data = new FormData();
  data.set("contentType", "image/webp");
  data.set("sizeBytes", "123456");
  return data;
}

const planData = {
  expiresAt: "2026-01-10T12:40:00.000Z",
  fileId: "file-id",
  upload: {
    headers: { "Content-Type": "image/webp" },
    method: "PUT",
    url: "https://r2.example.com/upload",
  },
};

describe("createProfileImageUploadPlanAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionCookie.mockResolvedValue(sessionId);
    mocks.sessionGetAccess.mockResolvedValue({
      ok: true,
      accessToken: "access-token",
    });
    mocks.createProfileImageUploadPlan.mockResolvedValue(successResult());
    mocks.clearSessionCookie.mockResolvedValue(undefined);
    mocks.sessionClear.mockResolvedValue(null);
  });

  it("redirects unauthenticated callers before invoking the API", async () => {
    mocks.readSessionCookie.mockResolvedValue(null);

    await expect(
      createProfileImageUploadPlanAction(initialState, formData()),
    ).rejects.toThrow("redirected");

    expect(mocks.createProfileImageUploadPlan).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("creates an upload plan through the current session access token", async () => {
    await expect(
      createProfileImageUploadPlanAction(initialState, formData()),
    ).resolves.toEqual({
      error: null,
      plan: {
        fileId: "file-id",
        uploadUrl: "https://r2.example.com/upload",
        uploadHeaders: { "Content-Type": "image/webp" },
        expiresAt: "2026-01-10T12:40:00.000Z",
      },
    });

    expect(mocks.sessionGetAccess).toHaveBeenCalledWith(sessionId, {
      forceRefresh: false,
    });
    expect(mocks.createProfileImageUploadPlan).toHaveBeenCalledWith(
      { contentType: "image/webp", sizeBytes: 123456 },
      "access-token",
    );
  });

  it("rejects an invalid file type without invoking the API", async () => {
    const data = formData();
    data.set("contentType", "image/gif");

    await expect(
      createProfileImageUploadPlanAction(initialState, data),
    ).resolves.toEqual({ error: "invalidInput", plan: null });

    expect(mocks.createProfileImageUploadPlan).not.toHaveBeenCalled();
    expect(mocks.sessionGetAccess).not.toHaveBeenCalled();
  });

  it("maps rate limiting to safe retry guidance", async () => {
    mocks.createProfileImageUploadPlan.mockResolvedValue(
      problemResult("RATE_LIMITED", 429),
    );

    await expect(
      createProfileImageUploadPlanAction(initialState, formData()),
    ).resolves.toEqual({ error: "rateLimited", plan: null });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("maps conflicts to safe retry feedback", async () => {
    mocks.createProfileImageUploadPlan.mockResolvedValue(
      problemResult("CONFLICT", 409),
    );

    await expect(
      createProfileImageUploadPlanAction(initialState, formData()),
    ).resolves.toEqual({ error: "conflict", plan: null });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes and retries once after an unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.createProfileImageUploadPlan
      .mockResolvedValueOnce(problemResult("UNAUTHORIZED", 401))
      .mockResolvedValueOnce(successResult());

    await expect(
      createProfileImageUploadPlanAction(initialState, formData()),
    ).resolves.toEqual({
      error: null,
      plan: {
        fileId: "file-id",
        uploadUrl: "https://r2.example.com/upload",
        uploadHeaders: { "Content-Type": "image/webp" },
        expiresAt: "2026-01-10T12:40:00.000Z",
      },
    });

    expect(mocks.sessionGetAccess).toHaveBeenNthCalledWith(2, sessionId, {
      forceRefresh: true,
    });
    expect(mocks.createProfileImageUploadPlan).toHaveBeenNthCalledWith(
      1,
      { contentType: "image/webp", sizeBytes: 123456 },
      "old-access-token",
    );
    expect(mocks.createProfileImageUploadPlan).toHaveBeenNthCalledWith(
      2,
      { contentType: "image/webp", sizeBytes: 123456 },
      "new-access-token",
    );
  });

  it("clears the local session after a second unauthorized response", async () => {
    mocks.sessionGetAccess
      .mockResolvedValueOnce({ ok: true, accessToken: "old-access-token" })
      .mockResolvedValueOnce({ ok: true, accessToken: "new-access-token" });
    mocks.createProfileImageUploadPlan.mockResolvedValue(
      problemResult("UNAUTHORIZED", 401),
    );

    await expect(
      createProfileImageUploadPlanAction(initialState, formData()),
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
      createProfileImageUploadPlanAction(initialState, formData()),
    ).resolves.toEqual({ error: "unavailable", plan: null });

    expect(mocks.createProfileImageUploadPlan).not.toHaveBeenCalled();
  });
});

function successResult() {
  return {
    data: planData,
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
