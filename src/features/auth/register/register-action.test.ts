import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerAction } from "./register-action";

const mocks = vi.hoisted(() => ({
  establishAuthenticatedSession: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
  registerWithPassword: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("../session/establish-authenticated-session", () => ({
  establishAuthenticatedSession: mocks.establishAuthenticatedSession,
}));

vi.mock("../server/auth-api", () => ({
  registerWithPassword: mocks.registerWithPassword,
}));

const initialState = { error: null } as const;
const registrationData = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  user: { id: "user-id" },
};

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.establishAuthenticatedSession.mockResolvedValue(true);
    mocks.registerWithPassword.mockResolvedValue({
      data: registrationData,
      ok: true,
      status: 200,
      traceId: "trace-id",
    });
  });

  it("rejects malformed input before calling the API", async () => {
    await expect(
      registerAction(
        initialState,
        formData("not-an-email", "short", "different"),
      ),
    ).resolves.toEqual({ error: "invalidInput" });

    expect(mocks.registerWithPassword).not.toHaveBeenCalled();
  });

  it("maps an existing email to safe frontend state", async () => {
    mocks.registerWithPassword.mockResolvedValue({
      failure: {
        kind: "problem",
        problem: {
          code: "AUTH_EMAIL_ALREADY_EXISTS",
        },
      },
      ok: false,
      status: 409,
      traceId: "trace-id",
    });

    await expect(
      registerAction(
        initialState,
        formData("existing@example.com", "test-password-10"),
      ),
    ).resolves.toEqual({ error: "emailAlreadyExists" });
    expect(mocks.establishAuthenticatedSession).not.toHaveBeenCalled();
  });

  it("establishes a session and redirects after a successful registration", async () => {
    await expect(
      registerAction(
        initialState,
        formData("new-user@example.com", "test-password-10"),
      ),
    ).rejects.toThrow("redirected");

    expect(mocks.registerWithPassword).toHaveBeenCalledWith({
      email: "new-user@example.com",
      password: "test-password-10",
    });
    expect(mocks.establishAuthenticatedSession).toHaveBeenCalledWith({
      accessToken: registrationData.accessToken,
      refreshToken: registrationData.refreshToken,
      userId: registrationData.user.id,
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/app");
  });

  it("reports unavailable when the local session cannot be established", async () => {
    mocks.establishAuthenticatedSession.mockResolvedValue(false);

    await expect(
      registerAction(
        initialState,
        formData("new-user@example.com", "test-password-10"),
      ),
    ).resolves.toEqual({ error: "unavailable" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

function formData(
  email: string,
  password: string,
  passwordConfirmation = password,
): FormData {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  data.set("passwordConfirmation", passwordConfirmation);
  return data;
}
