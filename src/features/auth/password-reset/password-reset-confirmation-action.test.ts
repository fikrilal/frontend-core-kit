import { beforeEach, describe, expect, it, vi } from "vitest";

import { confirmPasswordResetAction } from "./password-reset-confirmation-action";

const mocks = vi.hoisted(() => ({
  confirmPasswordReset: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("../server/auth-api", () => ({
  confirmPasswordReset: mocks.confirmPasswordReset,
}));

const initialState = { error: null } as const;

describe("confirmPasswordResetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirmPasswordReset.mockResolvedValue({
      data: undefined,
      ok: true,
      status: 204,
      traceId: "trace-id",
    });
  });

  it("rejects malformed input before calling the API", async () => {
    await expect(
      confirmPasswordResetAction(
        initialState,
        formData("", "short", "different"),
      ),
    ).resolves.toEqual({ error: "invalidInput" });

    expect(mocks.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords before calling the API", async () => {
    await expect(
      confirmPasswordResetAction(
        initialState,
        formData("reset-token", "new-password-10", "different-password"),
      ),
    ).resolves.toEqual({ error: "invalidInput" });

    expect(mocks.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it("sends the token and exact password, then redirects to clean sign in", async () => {
    await expect(
      confirmPasswordResetAction(
        initialState,
        formData("reset-token", "new-password-10"),
      ),
    ).rejects.toThrow("redirected");

    expect(mocks.confirmPasswordReset).toHaveBeenCalledWith({
      newPassword: "new-password-10",
      token: "reset-token",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/login?reset=success");
  });

  it("maps an invalid token without exposing backend details", async () => {
    mocks.confirmPasswordReset.mockResolvedValue({
      failure: {
        kind: "problem",
        problem: {
          code: "AUTH_PASSWORD_RESET_TOKEN_EXPIRED",
        },
      },
      ok: false,
      status: 400,
      traceId: "trace-id",
    });

    await expect(
      confirmPasswordResetAction(
        initialState,
        formData("expired-token", "new-password-10"),
      ),
    ).resolves.toEqual({ error: "invalidToken" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

function formData(
  token: string,
  newPassword: string,
  passwordConfirmation = newPassword,
): FormData {
  const data = new FormData();
  data.set("token", token);
  data.set("newPassword", newPassword);
  data.set("passwordConfirmation", passwordConfirmation);
  return data;
}
