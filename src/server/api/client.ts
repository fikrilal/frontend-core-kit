import "server-only";

import type { paths } from "@/contracts/lamara-api";
import { readServerConfig } from "@/server/config/env";
import createClient, { type Client } from "openapi-fetch";

export type LamaraApiClient = Client<paths>;

type FetchImplementation = (request: Request) => Promise<Response>;

type LamaraApiClientDependencies = Readonly<{
  baseUrl: string;
  fetch?: FetchImplementation;
  requestId?: () => string;
}>;

export class ApiRequestError extends Error {
  readonly requestId: string;

  constructor(requestId: string, cause: unknown) {
    super("Lamara API request failed.", { cause });
    this.name = "ApiRequestError";
    this.requestId = requestId;
  }
}

export function createLamaraApiClient({
  baseUrl,
  fetch: fetchImplementation = globalThis.fetch,
  requestId: createRequestId = () => globalThis.crypto.randomUUID(),
}: LamaraApiClientDependencies): LamaraApiClient {
  const normalizedBaseUrl = readServerConfig({
    LAMARA_API_BASE_URL: baseUrl,
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

export function createConfiguredLamaraApiClient(): LamaraApiClient {
  const config = readServerConfig();

  return createLamaraApiClient({
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
