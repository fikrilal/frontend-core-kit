import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyEmailAction } from "./email-verification-action";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
  verifyEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("./server/auth-api", () => ({
  verifyEmail: mocks.verifyEmail,
}));

const initialState = { error: null } as const;

describe("verifyEmailAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyEmail.mockResolvedValue({
      data: undefined,
      ok: true,
      status: 204,
      traceId: "trace-id",
    });
  });

  it("rejects an empty token before calling the API", async () => {
    await expect(
      verifyEmailAction(initialState, formData("")),
    ).resolves.toEqual({ error: "invalidInput" });

    expect(mocks.verifyEmail).not.toHaveBeenCalled();
  });

  it("sends the token and redirects to clean sign in", async () => {
    await expect(
      verifyEmailAction(initialState, formData("verification-token")),
    ).rejects.toThrow("redirected");

    expect(mocks.verifyEmail).toHaveBeenCalledWith({
      token: "verification-token",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/login?verified=success");
  });

  it("maps an invalid token without exposing backend details", async () => {
    mocks.verifyEmail.mockResolvedValue({
      failure: {
        kind: "problem",
        problem: {
          code: "AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRED",
        },
      },
      ok: false,
      status: 400,
      traceId: "trace-id",
    });

    await expect(
      verifyEmailAction(initialState, formData("expired-token")),
    ).resolves.toEqual({ error: "invalidToken" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

function formData(token: string): FormData {
  const data = new FormData();
  data.set("token", token);
  return data;
}
