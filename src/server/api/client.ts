import "server-only";

import type { paths } from "@/contracts/example-api";
import { readApiConfig } from "@/server/config/env";
import createClient, { type Client } from "openapi-fetch";

export type ExampleApiClient = Client<paths>;

type FetchImplementation = (request: Request) => Promise<Response>;

type ExampleApiClientDependencies = Readonly<{
  baseUrl: string;
  fetch?: FetchImplementation;
  requestId?: () => string;
}>;

export class ApiRequestError extends Error {
  readonly requestId: string;

  constructor(requestId: string, cause: unknown) {
    super("Example API request failed.", { cause });
    this.name = "ApiRequestError";
    this.requestId = requestId;
  }
}

export function createExampleApiClient({
  baseUrl,
  fetch: fetchImplementation = globalThis.fetch,
  requestId: createRequestId = () => globalThis.crypto.randomUUID(),
}: ExampleApiClientDependencies): ExampleApiClient {
  const normalizedBaseUrl = readApiConfig({
    EXAMPLE_API_BASE_URL: baseUrl,
  }).apiBaseUrl;

  return createClient<paths>({
    baseUrl: normalizedBaseUrl,
    headers: {
      Accept: "application/json",
    },
    fetch: async (request) => {
      const requestId = normalizeRequestId(
        request.headers.get("x-request-id") ?? createRequestId(),
      );
      const headers = new Headers(request.headers);
      headers.set("X-Request-Id", requestId);

      try {
        const response = await fetchImplementation(
          new Request(request, { headers }),
        );

        return withResponseRequestId(response, requestId);
      } catch (error) {
        throw new ApiRequestError(requestId, error);
      }
    },
  });
}

export function createConfiguredExampleApiClient(): ExampleApiClient {
  const config = readApiConfig();

  return createExampleApiClient({
    baseUrl: config.apiBaseUrl,
  });
}

function withResponseRequestId(
  response: Response,
  fallbackRequestId: string,
): Response {
  const responseRequestId = response.headers.get("x-request-id")?.trim();
  if (responseRequestId) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("X-Request-Id", fallbackRequestId);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

function normalizeRequestId(requestId: string): string {
  const normalized = requestId.trim();
  if (!normalized) {
    throw new TypeError("Request ID must not be empty.");
  }

  return normalized;
}
