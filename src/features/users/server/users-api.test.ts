import { afterEach, describe, expect, it, vi } from "vitest";

import {
  listSessions,
  patchCurrentUser,
  type PatchMeData,
  type PatchMeInput,
  type SessionsListData,
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

const sessions = [
  {
    createdAt: "2026-01-10T12:34:56.789Z",
    current: true,
    deviceId: "device-a",
    deviceName: "Dante's iPhone",
    expiresAt: "2026-02-10T12:34:56.789Z",
    id: "session-1",
    ip: "203.0.113.10",
    lastSeenAt: "2026-01-10T12:34:56.789Z",
    revokedAt: null,
    status: "active",
    userAgent: "Mozilla/5.0 (iPhone)",
  },
  {
    createdAt: "2026-01-05T08:00:00.000Z",
    current: false,
    deviceId: "device-b",
    deviceName: "Dante's MacBook",
    expiresAt: "2026-02-05T08:00:00.000Z",
    id: "session-2",
    ip: "198.51.100.7",
    lastSeenAt: "2026-01-08T20:15:00.000Z",
    revokedAt: "2026-01-09T09:30:00.000Z",
    status: "revoked",
    userAgent: "Mozilla/5.0 (Macintosh)",
  },
] satisfies SessionsListData;

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

  it("lists the current user sessions with a bearer token and validates the envelope", async () => {
    let captured: Request | undefined;
    vi.stubEnv("LAMARA_API_BASE_URL", "https://api.lamara.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        jsonResponse({
          data: sessions,
          meta: { hasMore: false, limit: 25 },
        }),
      );
    });

    const result = await listSessions("access-token");

    expect(result).toMatchObject({
      ok: true,
      data: sessions,
      status: 200,
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe("https://api.lamara.dev/v1/me/sessions");
    expect(captured.method).toBe("GET");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
  });

  it("rejects a malformed sessions envelope without leaking data", async () => {
    vi.stubEnv("LAMARA_API_BASE_URL", "https://api.lamara.dev");
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        jsonResponse({
          data: [{ id: "session-1", status: "active" }],
          meta: { limit: 25 },
        }),
      ),
    );

    const result = await listSessions("access-token");

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
