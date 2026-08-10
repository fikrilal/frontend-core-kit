import type { z } from "zod";

import { ApiRequestError } from "./client";
import { parseApiProblem, parseRetryAfter } from "./problem";
import type { ApiResult } from "./result";

type OpenApiResponse = Readonly<{
  data?: unknown;
  error?: unknown;
  response: Response;
}>;

type ApiEnvelope<TData, TMeta> = Readonly<{
  data: TData;
  meta?: TMeta;
}>;

export function readApiResult<TData, TMeta = unknown>(
  request: Promise<OpenApiResponse>,
  schema: z.ZodType<ApiEnvelope<TData, TMeta>>,
): Promise<ApiResult<TData, TMeta>> {
  return readResponse<TData, TMeta>(request, (result, status, traceId) => {
    if (!hasJsonMediaType(result.response)) {
      return invalidResponse(
        status,
        traceId,
        "Lamara API returned an unexpected success content type.",
      );
    }

    const json = parseJson(result.data);
    if (!json.ok) {
      return invalidResponse(
        status,
        traceId,
        "Lamara API returned an invalid success envelope.",
      );
    }

    const parsedEnvelope = schema.safeParse(json.value);
    if (!parsedEnvelope.success) {
      return invalidResponse(
        status,
        traceId,
        "Lamara API returned data that does not match the contract.",
      );
    }

    return {
      ok: true,
      data: parsedEnvelope.data.data,
      ...("meta" in parsedEnvelope.data
        ? { meta: parsedEnvelope.data.meta }
        : {}),
      status,
      traceId,
    };
  });
}

export function readEmptyApiResult(
  request: Promise<OpenApiResponse>,
): Promise<ApiResult<undefined>> {
  return readResponse<undefined>(request, (_result, status, traceId) => {
    if (status !== 204) {
      return invalidResponse(
        status,
        traceId,
        "Lamara API returned an unexpected non-empty success.",
      );
    }

    return {
      ok: true,
      data: undefined,
      status,
      traceId,
    };
  });
}

export function readOptionalApiResult<TData, TMeta = unknown>(
  request: Promise<OpenApiResponse>,
  schema: z.ZodType<ApiEnvelope<TData, TMeta>>,
): Promise<ApiResult<TData | null, TMeta>> {
  return readResponse<TData | null, TMeta>(
    request,
    (result, status, traceId) => {
      if (status === 204) {
        return {
          ok: true,
          data: null,
          status,
          traceId,
        };
      }

      if (!hasJsonMediaType(result.response)) {
        return invalidResponse(
          status,
          traceId,
          "Lamara API returned an unexpected success content type.",
        );
      }

      const json = parseJson(result.data);
      if (!json.ok) {
        return invalidResponse(
          status,
          traceId,
          "Lamara API returned an invalid success envelope.",
        );
      }

      const parsedEnvelope = schema.safeParse(json.value);
      if (!parsedEnvelope.success) {
        return invalidResponse(
          status,
          traceId,
          "Lamara API returned data that does not match the contract.",
        );
      }

      return {
        ok: true,
        data: parsedEnvelope.data.data,
        ...("meta" in parsedEnvelope.data
          ? { meta: parsedEnvelope.data.meta }
          : {}),
        status,
        traceId,
      };
    },
  );
}

async function readResponse<TData, TMeta = unknown>(
  request: Promise<OpenApiResponse>,
  readSuccess: (
    result: OpenApiResponse,
    status: number,
    traceId: string,
  ) => ApiResult<TData, TMeta>,
): Promise<ApiResult<TData, TMeta>> {
  try {
    const result = await request;
    const status = result.response.status;
    const traceId = readTraceId(result.response);

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

    return readSuccess(result, status, traceId);
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

function invalidResponse<TData = never, TMeta = unknown>(
  status: number,
  traceId: string,
  message: string,
): ApiResult<TData, TMeta> {
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

function readTraceId(response: Response): string {
  const responseRequestId = response.headers.get("x-request-id")?.trim();
  if (!responseRequestId) {
    return "unknown";
  }
  return responseRequestId;
}

function hasJsonMediaType(response: Response): boolean {
  const contentType = response.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();

  return (
    contentType === "application/json" ||
    (contentType?.startsWith("application/") === true &&
      contentType.endsWith("+json"))
  );
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
