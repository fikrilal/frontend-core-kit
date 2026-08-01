import assert from "node:assert/strict";
import test from "node:test";

import { checkBackendReadiness } from "./backend-preflight.mjs";

test("fails before network access when API configuration is missing", async () => {
  let called = false;
  const result = await checkBackendReadiness({
    environment: {},
    fetchImpl: () => {
      called = true;
      throw new Error("unexpected fetch");
    },
  });

  assert.equal(result.code, "missing_config");
  assert.equal(called, false);
});

test("does not expose invalid configuration or response bodies", async () => {
  const secretUrl = "https://secret:password@example.com/private";
  const invalidConfig = await checkBackendReadiness({
    environment: { LAMARA_API_BASE_URL: secretUrl },
  });
  assert.equal(invalidConfig.code, "invalid_config");
  assert.doesNotMatch(invalidConfig.message, /secret|password|example\.com/);

  const secretBody = "private-backend-payload";
  const invalidBody = await checkBackendReadiness({
    environment: { LAMARA_API_BASE_URL: "http://127.0.0.1:4000" },
    fetchImpl: async () => new Response(secretBody, { status: 200 }),
  });
  assert.equal(invalidBody.code, "invalid_response");
  assert.doesNotMatch(invalidBody.message, new RegExp(secretBody));
});

test("distinguishes unreachable, non-ready, and contract mismatch outcomes", async () => {
  const environment = { LAMARA_API_BASE_URL: "http://127.0.0.1:4000" };
  const unreachable = await checkBackendReadiness({
    environment,
    fetchImpl: () => Promise.reject(new Error("offline")),
  });
  const notReady = await checkBackendReadiness({
    environment,
    fetchImpl: async () => new Response(null, { status: 503 }),
  });
  const mismatch = await checkBackendReadiness({
    environment,
    fetchImpl: async () => Response.json({ ready: true }),
  });

  assert.equal(unreachable.code, "unreachable");
  assert.equal(notReady.code, "not_ready");
  assert.equal(mismatch.code, "contract_mismatch");
});

test("accepts a ready response matching the committed contract", async () => {
  const result = await checkBackendReadiness({
    environment: { LAMARA_API_BASE_URL: "http://127.0.0.1:4000" },
    fetchImpl: async (url, init) => {
      assert.equal(url, "http://127.0.0.1:4000/ready");
      assert.equal(init.method, "GET");
      assert.equal(init.headers.Authorization, undefined);
      return Response.json({ status: "ok" });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.code, "ready");
});
