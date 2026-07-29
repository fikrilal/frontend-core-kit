import { z } from "zod";
import { describe, expect, it } from "vitest";

import { createLamaraApiClient } from "./client";
import { readApiResult } from "./response";

const loginPath = "/v1/auth/password/login";
const loginInput = {
  email: "dante@example.com",
  password: "must-not-leak",
};
const dataSchema = z.object({
  value: z.string(),
});

describe("readApiResult", () => {
  it("parses problem details and prefers the response request ID", async () => {
    const client = createLamaraApiClient({
      baseUrl: "https://api.lamara.dev",
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
      dataSchema,
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
    const client = createLamaraApiClient({
      baseUrl: "https://api.lamara.dev",
      requestId: () => "request-id",
      fetch: () => Promise.resolve(response),
    });

    const result = await readApiResult(
      client.POST(loginPath, {
        body: loginInput,
        cache: "no-store",
        parseAs: "text",
      }),
      dataSchema,
    );

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: "invalid-response",
        message: "Lamara API returned invalid problem details.",
      },
      status: response.status,
      traceId: "request-id",
    });
    expect(JSON.stringify(result)).not.toContain(loginInput.password);
    expect(JSON.stringify(result)).not.toContain("Bad gateway");
  });

  it("handles malformed successful JSON without returning its body", async () => {
    const client = createLamaraApiClient({
      baseUrl: "https://api.lamara.dev",
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
      dataSchema,
    );

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: "invalid-response",
        message: "Lamara API returned an invalid success envelope.",
      },
      status: 200,
      traceId: "request-id",
    });
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
  });

  it("distinguishes network, timeout, and cancellation failures", async () => {
    const networkClient = createLamaraApiClient({
      baseUrl: "https://api.lamara.dev",
      requestId: () => "network-id",
      fetch: () => Promise.reject(new TypeError("connection failed")),
    });
    const timeoutClient = createLamaraApiClient({
      baseUrl: "https://api.lamara.dev",
      requestId: () => "timeout-id",
      fetch: abortablePendingFetch,
    });
    const cancelledClient = createLamaraApiClient({
      baseUrl: "https://api.lamara.dev",
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
        dataSchema,
      ),
      readApiResult(
        timeoutClient.POST(loginPath, {
          body: loginInput,
          parseAs: "text",
          signal: AbortSignal.timeout(1),
        }),
        dataSchema,
      ),
      readApiResult(
        cancelledClient.POST(loginPath, {
          body: loginInput,
          parseAs: "text",
          signal: caller.signal,
        }),
        dataSchema,
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
    const client = createLamaraApiClient({
      baseUrl: "https://api.lamara.dev",
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
        dataSchema,
      ),
    ).rejects.toThrow();
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
