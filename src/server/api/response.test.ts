import { z } from "zod";
import { describe, expect, it } from "vitest";

import { createExampleApiClient } from "./client";
import { readApiResult, readEmptyApiResult, readPlainApiResult } from "./index";

const loginPath = "/v1/auth/password/login";
const loginInput = {
  email: "dante@example.com",
  password: "must-not-leak",
};
const dataSchema = z.object({
  value: z.string(),
});
const envelopeSchema = z.object({
  data: dataSchema,
});

describe("readApiResult", () => {
  it("validates the complete envelope and returns typed metadata", async () => {
    const schema = z.object({
      data: dataSchema,
      meta: z.object({ nextCursor: z.string().nullable() }),
    });
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "request-id",
      fetch: () =>
        Promise.resolve(
          jsonResponse({
            data: { value: "valid" },
            meta: { nextCursor: "cursor-id" },
          }),
        ),
    });

    const result = await readApiResult(
      client.POST(loginPath, {
        body: loginInput,
        parseAs: "text",
      }),
      schema,
    );

    expect(result).toEqual({
      ok: true,
      data: { value: "valid" },
      meta: { nextCursor: "cursor-id" },
      status: 200,
      traceId: "request-id",
    });
  });

  it("rejects a successful response with an unexpected content type", async () => {
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "request-id",
      fetch: () =>
        Promise.resolve(
          new Response(JSON.stringify({ data: { value: "secret" } }), {
            headers: { "Content-Type": "text/plain" },
          }),
        ),
    });

    const result = await readApiResult(
      client.POST(loginPath, {
        body: loginInput,
        parseAs: "text",
      }),
      envelopeSchema,
    );

    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "invalid-response" },
      status: 200,
    });
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("parses problem details and prefers the response request ID", async () => {
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "frontend-request-id",
      fetch: () =>
        Promise.resolve(
          jsonResponse(
            {
              type: "about:blank",
              title: "Unauthorized",
              status: 401,
              detail: "Credentials were rejected.",
              code: "AUTH_INVALID_CREDENTIALS",
              traceId: "body-request-id",
            },
            {
              status: 401,
              headers: {
                "Retry-After": "60",
                "X-Request-Id": "backend-request-id",
              },
            },
          ),
        ),
    });

    const result = await readApiResult(
      client.POST(loginPath, {
        body: loginInput,
        cache: "no-store",
        parseAs: "text",
      }),
      envelopeSchema,
    );

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: "problem",
        problem: {
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          code: "AUTH_INVALID_CREDENTIALS",
          traceId: "body-request-id",
        },
        retryAfterSeconds: 60,
      },
      status: 401,
      traceId: "backend-request-id",
    });
    expect(JSON.stringify(result)).not.toContain("Credentials were rejected.");
    expect(JSON.stringify(result)).not.toContain(loginInput.password);
  });

  it.each([
    {
      name: "malformed JSON error",
      response: new Response("{", {
        status: 500,
        headers: { "Content-Type": "application/problem+json" },
      }),
    },
    {
      name: "non-JSON error",
      response: new Response("<h1>Bad gateway</h1>", {
        status: 502,
        headers: { "Content-Type": "text/html" },
      }),
    },
    {
      name: "mismatched problem status",
      response: jsonResponse(
        {
          type: "about:blank",
          title: "Unauthorized",
          status: 403,
          code: "AUTH_INVALID_CREDENTIALS",
          traceId: "trace-id",
        },
        { status: 401 },
      ),
    },
  ])("handles $name without returning the raw body", async ({ response }) => {
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "request-id",
      fetch: () => Promise.resolve(response),
    });

    const result = await readApiResult(
      client.POST(loginPath, {
        body: loginInput,
        cache: "no-store",
        parseAs: "text",
      }),
      envelopeSchema,
    );

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: "invalid-response",
        message: "Example API returned invalid problem details.",
      },
      status: response.status,
      traceId: "request-id",
    });
    expect(JSON.stringify(result)).not.toContain(loginInput.password);
    expect(JSON.stringify(result)).not.toContain("Bad gateway");
  });

  it("handles malformed successful JSON without returning its body", async () => {
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "request-id",
      fetch: () =>
        Promise.resolve(
          new Response('{"token":"must-not-leak"', {
            headers: { "Content-Type": "application/json" },
          }),
        ),
    });

    const result = await readApiResult(
      client.POST(loginPath, {
        body: loginInput,
        cache: "no-store",
        parseAs: "text",
      }),
      envelopeSchema,
    );

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: "invalid-response",
        message: "Example API returned an invalid success envelope.",
      },
      status: 200,
      traceId: "request-id",
    });
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
  });

  it("distinguishes network, timeout, and cancellation failures", async () => {
    const networkClient = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "network-id",
      fetch: () => Promise.reject(new TypeError("connection failed")),
    });
    const timeoutClient = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "timeout-id",
      fetch: abortablePendingFetch,
    });
    const cancelledClient = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "cancelled-id",
      fetch: abortablePendingFetch,
    });
    const caller = new AbortController();
    caller.abort();

    const [network, timeout, cancelled] = await Promise.all([
      readApiResult(
        networkClient.POST(loginPath, {
          body: loginInput,
          parseAs: "text",
        }),
        envelopeSchema,
      ),
      readApiResult(
        timeoutClient.POST(loginPath, {
          body: loginInput,
          parseAs: "text",
          signal: AbortSignal.timeout(1),
        }),
        envelopeSchema,
      ),
      readApiResult(
        cancelledClient.POST(loginPath, {
          body: loginInput,
          parseAs: "text",
          signal: caller.signal,
        }),
        envelopeSchema,
      ),
    ]);

    expect(network).toMatchObject({
      ok: false,
      failure: { kind: "network" },
      status: null,
      traceId: "network-id",
    });
    expect(timeout).toMatchObject({
      ok: false,
      failure: { kind: "timeout" },
      status: null,
      traceId: "timeout-id",
    });
    expect(cancelled).toMatchObject({
      ok: false,
      failure: { kind: "cancelled" },
      status: null,
      traceId: "cancelled-id",
    });
  });

  it("does not convert programmer errors into network failures", async () => {
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      fetch: abortablePendingFetch,
    });
    const circularBody = {
      ...loginInput,
      self: {},
    };
    circularBody.self = circularBody;

    await expect(
      readApiResult(
        client.POST(loginPath, {
          body: circularBody,
          parseAs: "text",
        }),
        envelopeSchema,
      ),
    ).rejects.toThrow();
  });
});

describe("readEmptyApiResult", () => {
  it("accepts an empty 204 response without parsing JSON", async () => {
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "request-id",
      fetch: () => Promise.resolve(new Response(null, { status: 204 })),
    });

    const result = await readEmptyApiResult(
      client.POST("/v1/auth/logout", {
        body: { refreshToken: "refresh-token" },
        parseAs: "text",
      }),
    );

    expect(result).toEqual({
      ok: true,
      data: undefined,
      status: 204,
      traceId: "request-id",
    });
  });

  it("rejects an unexpected non-empty success status", async () => {
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "request-id",
      fetch: () => Promise.resolve(jsonResponse({ data: null })),
    });

    const result = await readEmptyApiResult(
      client.POST("/v1/auth/logout", {
        body: { refreshToken: "refresh-token" },
        parseAs: "text",
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "invalid-response" },
      status: 200,
    });
  });
});

describe("readPlainApiResult", () => {
  it("validates a plain non-enveloped json response", async () => {
    const healthSchema = z.object({
      status: z.string(),
    });
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "request-id",
      fetch: () =>
        Promise.resolve(
          new Response(JSON.stringify({ status: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    });

    const result = await readPlainApiResult(
      client.GET("/health", { parseAs: "text" }),
      healthSchema,
    );

    expect(result).toEqual({
      ok: true,
      data: { status: "ok" },
      status: 200,
      traceId: "request-id",
    });
  });

  it("rejects non-matching plain responses", async () => {
    const healthSchema = z.object({
      status: z.string(),
    });
    const client = createExampleApiClient({
      baseUrl: "https://api.example.dev",
      requestId: () => "request-id",
      fetch: () =>
        Promise.resolve(
          new Response(JSON.stringify({ other: 123 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    });

    const result = await readPlainApiResult(
      client.GET("/health", { parseAs: "text" }),
      healthSchema,
    );

    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "invalid-response" },
      status: 200,
    });
  });
});

function abortablePendingFetch(request: Request): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const rejectForAbort = () => {
      const reason: unknown = request.signal.reason;
      reject(
        reason instanceof Error
          ? reason
          : new DOMException("Request aborted", "AbortError"),
      );
    };

    if (request.signal.aborted) {
      rejectForAbort();
      return;
    }

    request.signal.addEventListener("abort", rejectForAbort, { once: true });
  });
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/problem+json");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}
