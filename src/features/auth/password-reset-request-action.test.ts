import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestPasswordResetAction } from "./password-reset-request-action";

const mocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock("./server/auth-api", () => ({
  requestPasswordReset: mocks.requestPasswordReset,
}));

const initialState = { error: null, sent: false } as const;

describe("requestPasswordResetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestPasswordReset.mockResolvedValue({
      data: undefined,
      ok: true,
      status: 204,
      traceId: "trace-id",
    });
  });

  it("rejects malformed input before calling the API", async () => {
    await expect(
      requestPasswordResetAction(initialState, formData("not-an-email")),
    ).resolves.toEqual({ error: "invalidInput", sent: false });

    expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("returns the same sent state for a successful request", async () => {
    await expect(
      requestPasswordResetAction(
        initialState,
        formData("  user@example.com  "),
      ),
    ).resolves.toEqual({ error: null, sent: true });

    expect(mocks.requestPasswordReset).toHaveBeenCalledWith({
      email: "user@example.com",
    });
  });

  it("maps rate limiting to safe retry state", async () => {
    mocks.requestPasswordReset.mockResolvedValue({
      failure: {
        kind: "problem",
        problem: { code: "RATE_LIMITED" },
      },
      ok: false,
      status: 429,
      traceId: "trace-id",
    });

    await expect(
      requestPasswordResetAction(initialState, formData("user@example.com")),
    ).resolves.toEqual({ error: "rateLimited", sent: false });
  });

  it("maps unavailable API outcomes without exposing backend details", async () => {
    mocks.requestPasswordReset.mockResolvedValue({
      failure: {
        kind: "network",
        message: "sensitive backend detail must not be shown",
      },
      ok: false,
      status: null,
      traceId: "trace-id",
    });

    await expect(
      requestPasswordResetAction(initialState, formData("user@example.com")),
    ).resolves.toEqual({ error: "unavailable", sent: false });
  });
});

function formData(email: string): FormData {
  const data = new FormData();
  data.set("email", email);
  return data;
}
