import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cancelAccountDeletion,
  clearProfileImage,
  completeProfileImageUpload,
  createProfileImageUploadPlan,
  getProfileImageUrl,
  listSessions,
  patchCurrentUser,
  requestAccountDeletion,
  revokeSession,
  type PatchMeData,
  type PatchMeInput,
  type ProfileImageCompleteInput,
  type ProfileImageUploadData,
  type ProfileImageUploadInput,
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

const uploadPlanInput = {
  contentType: "image/webp",
  sizeBytes: 123456,
} satisfies ProfileImageUploadInput;

const uploadPlanData = {
  expiresAt: "2026-01-10T12:40:00.000Z",
  fileId: "file-id",
  upload: {
    headers: { "Content-Type": "image/webp" },
    method: "PUT",
    url: "https://r2.example.com/upload",
  },
} satisfies ProfileImageUploadData;

const completeUploadInput = {
  fileId: "file-id",
} satisfies ProfileImageCompleteInput;

const profileImageUrlData = {
  expiresAt: "2026-01-10T12:40:00.000Z",
  url: "https://r2.example.com/render",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("users API", () => {
  it("patches the current user with a bearer token and validates the envelope", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
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
    expect(captured.url).toBe("https://api.example.dev/v1/me");
    expect(captured.method).toBe("PATCH");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
    expect(await captured.json()).toEqual(patchInput);
  });

  it("rejects a malformed envelope without leaking data", async () => {
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
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
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
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
    expect(captured.url).toBe("https://api.example.dev/v1/me/sessions");
    expect(captured.method).toBe("GET");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
  });

  it("rejects a malformed sessions envelope without leaking data", async () => {
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
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

  it("revokes a session through the empty-response contract", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        new Response(null, {
          status: 204,
          headers: { "X-Request-Id": "backend-request-id" },
        }),
      );
    });

    const result = await revokeSession("session-1", "access-token");

    expect(result).toEqual({
      ok: true,
      data: undefined,
      status: 204,
      traceId: "backend-request-id",
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe(
      "https://api.example.dev/v1/me/sessions/session-1/revoke",
    );
    expect(captured.method).toBe("POST");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
    expect(await captured.text()).toBe("");
  });

  it("requests account deletion through the empty-response contract", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        new Response(null, {
          status: 204,
          headers: { "X-Request-Id": "backend-request-id" },
        }),
      );
    });

    const result = await requestAccountDeletion("access-token");

    expect(result).toEqual({
      ok: true,
      data: undefined,
      status: 204,
      traceId: "backend-request-id",
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe(
      "https://api.example.dev/v1/me/account-deletion/request",
    );
    expect(captured.method).toBe("POST");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
    expect(await captured.text()).toBe("");
  });

  it("cancels account deletion through the empty-response contract", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        new Response(null, {
          status: 204,
          headers: { "X-Request-Id": "backend-request-id" },
        }),
      );
    });

    const result = await cancelAccountDeletion("access-token");

    expect(result).toEqual({
      ok: true,
      data: undefined,
      status: 204,
      traceId: "backend-request-id",
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe(
      "https://api.example.dev/v1/me/account-deletion/cancel",
    );
    expect(captured.method).toBe("POST");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
    expect(await captured.text()).toBe("");
  });

  it("creates a profile image upload plan with a bearer token and validates the envelope", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(jsonResponse({ data: uploadPlanData }));
    });

    const result = await createProfileImageUploadPlan(
      uploadPlanInput,
      "access-token",
    );

    expect(result).toMatchObject({
      ok: true,
      data: uploadPlanData,
      status: 200,
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe(
      "https://api.example.dev/v1/me/profile-image/upload",
    );
    expect(captured.method).toBe("POST");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
    expect(await captured.json()).toEqual(uploadPlanInput);
  });

  it("completes a profile image upload through the empty-response contract", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        new Response(null, {
          status: 204,
          headers: { "X-Request-Id": "backend-request-id" },
        }),
      );
    });

    const result = await completeProfileImageUpload(
      completeUploadInput,
      "access-token",
    );

    expect(result).toEqual({
      ok: true,
      data: undefined,
      status: 204,
      traceId: "backend-request-id",
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe(
      "https://api.example.dev/v1/me/profile-image/complete",
    );
    expect(captured.method).toBe("POST");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
    expect(await captured.json()).toEqual(completeUploadInput);
  });

  it("loads the profile image url with a bearer token and validates the envelope", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(jsonResponse({ data: profileImageUrlData }));
    });

    const result = await getProfileImageUrl("access-token");

    expect(result).toMatchObject({
      ok: true,
      data: profileImageUrlData,
      status: 200,
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe(
      "https://api.example.dev/v1/me/profile-image/url",
    );
    expect(captured.method).toBe("GET");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
  });

  it("returns null when no profile image is set", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        new Response(null, {
          status: 204,
          headers: { "X-Request-Id": "backend-request-id" },
        }),
      );
    });

    const result = await getProfileImageUrl("access-token");

    expect(result).toEqual({
      ok: true,
      data: null,
      status: 204,
      traceId: "backend-request-id",
    });
    expect(captured).toBeDefined();
  });

  it("clears the profile image through the empty-response contract", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        new Response(null, {
          status: 204,
          headers: { "X-Request-Id": "backend-request-id" },
        }),
      );
    });

    const result = await clearProfileImage("access-token");

    expect(result).toEqual({
      ok: true,
      data: undefined,
      status: 204,
      traceId: "backend-request-id",
    });
    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }
    expect(captured.url).toBe("https://api.example.dev/v1/me/profile-image");
    expect(captured.method).toBe("DELETE");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("authorization")).toBe("Bearer access-token");
    expect(await captured.text()).toBe("");
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
