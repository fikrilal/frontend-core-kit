import { afterEach, describe, expect, it, vi } from "vitest";

import type { PasswordLoginData, PasswordLoginInput } from "./password-login";
import { loginWithPassword } from "./password-login";

const input = {
  email: "dante@example.com",
  password: "correct horse battery staple",
  deviceId: "browser-install-id",
  deviceName: "Dante's browser",
} satisfies PasswordLoginInput;

const loginData = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  user: {
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
  },
} satisfies PasswordLoginData;

describe("loginWithPassword", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the generated endpoint contract and returns validated login data", async () => {
    let captured: Request | undefined;
    vi.stubEnv("LAMARA_API_BASE_URL", "https://api.lamara.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        jsonResponse(
          { data: loginData },
          {
            headers: {
              "X-Request-Id": "backend-request-id",
            },
          },
        ),
      );
    });

    const result = await loginWithPassword(input);

    expect(result).toEqual({
      ok: true,
      data: loginData,
      status: 200,
      traceId: "backend-request-id",
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }

    expect(captured.url).toBe("https://api.lamara.dev/v1/auth/password/login");
    expect(captured.method).toBe("POST");
    expect(captured.cache).toBe("no-store");
    expect(await captured.json()).toEqual(input);
    expect(captured.headers.get("accept")).toBe("application/json");
    expect(captured.headers.get("content-type")).toBe("application/json");
    expect(captured.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("rejects invalid login data without returning token values", async () => {
    vi.stubEnv("LAMARA_API_BASE_URL", "https://api.lamara.dev");
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        jsonResponse({
          data: {
            accessToken: "must-not-leak-access",
            refreshToken: "must-not-leak-refresh",
            user: null,
          },
        }),
      ),
    );

    const result = await loginWithPassword(input);
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      ok: false,
      failure: {
        kind: "invalid-response",
        message: "Lamara API returned data that does not match the contract.",
      },
      status: 200,
    });
    expect(serialized).not.toContain("must-not-leak-access");
    expect(serialized).not.toContain("must-not-leak-refresh");
    expect(serialized).not.toContain(input.password);
  });
});

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}
