import type { z } from "zod";

import { ApiRequestError } from "./client";
import { parseApiProblem, parseRetryAfter } from "./problem";
import type { ApiResult } from "./result";

type OpenApiResponse = Readonly<{
  data?: unknown;
  error?: unknown;
  response: Response;
}>;

export async function readApiResult<T>(
  request: Promise<OpenApiResponse>,
  schema: z.ZodType<T>,
): Promise<ApiResult<T>> {
  try {
    const result = await request;
    const status = result.response.status;
    const responseRequestId = result.response.headers
      .get("x-request-id")
      ?.trim();
    const traceId =
      responseRequestId === undefined || responseRequestId.length === 0
        ? "unknown"
        : responseRequestId;

    if (!result.response.ok) {
      const problem = parseApiProblem(result.error, status);
      if (!problem) {
        return invalidResponse(
          status,
          traceId,
          "Lamara API returned invalid problem details.",
        );
      }

      return {
        ok: false,
        failure: {
          kind: "problem",
          problem,
          retryAfterSeconds: parseRetryAfter(
            result.response.headers.get("retry-after"),
          ),
        },
        status,
        traceId,
      };
    }

    const json = parseJson(result.data);
    if (!json.ok || !isRecord(json.value) || !("data" in json.value)) {
      return invalidResponse(
        status,
        traceId,
        "Lamara API returned an invalid success envelope.",
      );
    }

    const parsedData = schema.safeParse(json.value.data);
    if (!parsedData.success) {
      return invalidResponse(
        status,
        traceId,
        "Lamara API returned data that does not match the contract.",
      );
    }

    return {
      ok: true,
      data: parsedData.data,
      ...("meta" in json.value ? { meta: json.value.meta } : {}),
      status,
      traceId,
    };
  } catch (error) {
    if (!(error instanceof ApiRequestError)) {
      throw error;
    }

    if (hasErrorName(error.cause, "TimeoutError")) {
      return {
        ok: false,
        failure: {
          kind: "timeout",
          outcome: "unknown",
          message: "Lamara API request timed out.",
        },
        status: null,
        traceId: error.requestId,
      };
    }

    if (hasErrorName(error.cause, "AbortError")) {
      return {
        ok: false,
        failure: {
          kind: "cancelled",
          message: "Lamara API request was cancelled.",
        },
        status: null,
        traceId: error.requestId,
      };
    }

    return {
      ok: false,
      failure: {
        kind: "network",
        message: "Unable to reach Lamara API.",
      },
      status: null,
      traceId: error.requestId,
    };
  }
}

function parseJson(
  value: unknown,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  if (typeof value !== "string") {
    return { ok: true, value };
  }

  if (value.length === 0) {
    return { ok: false };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(value) as unknown,
    };
  } catch {
    return { ok: false };
  }
}

function invalidResponse(
  status: number,
  traceId: string,
  message: string,
): ApiResult<never> {
  return {
    ok: false,
    failure: {
      kind: "invalid-response",
      message,
    },
    status,
    traceId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasErrorName(value: unknown, expectedName: string): boolean {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    value.name === expectedName
  );
}
