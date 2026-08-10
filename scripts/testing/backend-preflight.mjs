import { ReadyGetResponse } from "../../src/contracts/example-api/runtime.generated.ts";

const timeoutMs = 5_000;

export async function checkBackendReadiness({
  environment = process.env,
  fetchImpl = fetch,
} = {}) {
  const configured = readApiOrigin(environment.EXAMPLE_API_BASE_URL);
  if (!configured.ok) return configured;

  let response;
  try {
    response = await fetchImpl(`${configured.origin}/ready`, {
      headers: { Accept: "application/json" },
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return failure(
      "unreachable",
      "Backend preflight failed: readiness endpoint is unreachable or timed out.",
    );
  }

  if (response.status !== 200) {
    return failure(
      "not_ready",
      `Backend preflight failed: readiness endpoint returned HTTP ${response.status}.`,
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    return failure(
      "invalid_response",
      "Backend preflight failed: readiness endpoint did not return valid JSON.",
    );
  }

  if (!ReadyGetResponse.safeParse(body).success) {
    return failure(
      "contract_mismatch",
      "Backend preflight failed: readiness response does not match the committed API contract.",
    );
  }

  return {
    ok: true,
    code: "ready",
    message:
      "Backend preflight passed: configuration, reachability, and readiness contract are valid.",
  };
}

function readApiOrigin(value) {
  if (!value) {
    return failure(
      "missing_config",
      "Backend preflight failed: EXAMPLE_API_BASE_URL is missing. Configure it in the process environment or .env.local.",
    );
  }

  try {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error("invalid origin");
    }
    return { ok: true, origin: url.origin };
  } catch {
    return failure(
      "invalid_config",
      "Backend preflight failed: EXAMPLE_API_BASE_URL must be an HTTP(S) origin without credentials, path, query, or fragment.",
    );
  }
}

function failure(code, message) {
  return { ok: false, code, message };
}
