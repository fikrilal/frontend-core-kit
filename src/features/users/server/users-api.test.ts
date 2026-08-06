import { afterEach, describe, expect, it, vi } from "vitest";

import {
  patchCurrentUser,
  type PatchMeData,
  type PatchMeInput,
} from "./users-api";

const patchInput = {
  profile: {
    displayName: "Dante",
    givenName: "Dante",
    familyName: "Alighieri",
  },
} satisfies PatchMeInput;

const currentUser = {
  accountDeletion: null,
  authMethods: ["PASSWORD"],
  email: "dante@example.com",
  emailVerified: true,
  id: "user-id",
  profile: {
    displayName: "Dante",
    familyName: "Alighieri",
    givenName: "Dante",
    profileImageFileId: null,
  },
  roles: ["USER"],
} satisfies PatchMeData;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("users API", () => {
  it("patches the current user with a bearer token and validates the envelope", async () => {
    let captured: Request | undefined;
    vi.stubEnv("LAMARA_API_BASE_URL", "https://api.lamara.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(jsonResponse({ data: currentUser }));
    });

    const result = await patchCurrentUser(patchInput, "access-token");

    expect(result).toMatchObject({
      ok: true,
      data: currentUser,
      status: 200,
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe("https://api.lamara.dev/v1/me");
    expect(captured.method).toBe("PATCH");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
    expect(await captured.json()).toEqual(patchInput);
  });

  it("rejects a malformed envelope without leaking data", async () => {
    vi.stubEnv("LAMARA_API_BASE_URL", "https://api.lamara.dev");
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        jsonResponse({
          data: {
            email: "dante@example.com",
            profile: null,
          },
        }),
      ),
    );

    const result = await patchCurrentUser(patchInput, "access-token");

    expect(result).toMatchObject({
      ok: false,
      failure: {
        kind: "invalid-response",
      },
      status: 200,
    });
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
