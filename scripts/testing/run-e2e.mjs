#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import process from "node:process";

import {
  fixtureContracts,
  parseFixtureContract,
  tryParseFixtureContract,
} from "./api-fixture-contracts.mjs";

const apiPort = 4_400;
let playwright;
let stopping = false;

const api = createServer(async (request, response) => {
  const requestId = request.headers["x-request-id"] ?? crypto.randomUUID();
  response.setHeader("Content-Type", "application/json");
  response.setHeader("X-Request-Id", requestId);

  if (request.method === "POST" && request.url === "/v1/auth/password/login") {
    const body = await readJson(request);
    const parsed = tryParseFixtureContract(fixtureContracts.loginRequest, body);
    if (!parsed) return problem(response, 400, "VALIDATION_ERROR");
    if (
      parsed.email !== "user@example.com" ||
      parsed.password !== "test-password"
    ) {
      return problem(response, 401, "AUTH_INVALID_CREDENTIALS");
    }

    return contractJson(
      response,
      200,
      "password login response",
      fixtureContracts.loginResponse,
      {
        data: {
          accessToken: accessToken(),
          refreshToken: "e2e-refresh-token",
          user: me,
        },
      },
    );
  }

  if (
    request.method === "POST" &&
    request.url === "/v1/auth/password/register"
  ) {
    const body = await readJson(request);
    const parsed = tryParseFixtureContract(
      fixtureContracts.registerRequest,
      body,
    );
    if (!parsed) return problem(response, 400, "VALIDATION_FAILED");
    if (parsed.email === "existing@example.com") {
      return problem(response, 409, "AUTH_EMAIL_ALREADY_EXISTS");
    }
    if (
      parsed.email !== "new-user@example.com" ||
      parsed.password !== "test-password-10"
    ) {
      return problem(response, 400, "VALIDATION_FAILED");
    }

    return contractJson(
      response,
      200,
      "password registration response",
      fixtureContracts.registerResponse,
      {
        data: {
          accessToken: accessToken(registeredMe),
          refreshToken: "e2e-registration-refresh-token",
          user: registeredMe,
        },
      },
    );
  }

  if (
    request.method === "POST" &&
    request.url === "/v1/auth/password/reset/request"
  ) {
    const parsed = tryParseFixtureContract(
      fixtureContracts.resetRequest,
      await readJson(request),
    );
    if (!parsed) return problem(response, 400, "VALIDATION_FAILED");
    if (parsed.email === "rate-limited@example.com") {
      return problem(response, 429, "RATE_LIMITED");
    }

    parseFixtureContract(
      "password reset response",
      fixtureContracts.resetResponse,
      undefined,
    );
    response.statusCode = 204;
    response.removeHeader("Content-Type");
    return response.end();
  }

  if (request.method === "POST" && request.url === "/v1/auth/refresh") {
    const parsed = tryParseFixtureContract(
      fixtureContracts.refreshRequest,
      await readJson(request),
    );
    if (!parsed) return problem(response, 400, "VALIDATION_ERROR");
    return contractJson(
      response,
      200,
      "refresh response",
      fixtureContracts.refreshResponse,
      {
        data: {
          accessToken: accessToken(),
          refreshToken: "e2e-rotated-refresh-token",
          user: {
            id: me.id,
            email: me.email,
            emailVerified: me.emailVerified,
          },
        },
      },
    );
  }

  if (request.method === "POST" && request.url === "/v1/auth/logout") {
    const parsed = tryParseFixtureContract(
      fixtureContracts.logoutRequest,
      await readJson(request),
    );
    if (!parsed) return problem(response, 400, "VALIDATION_ERROR");
    parseFixtureContract(
      "logout response",
      fixtureContracts.logoutResponse,
      undefined,
    );
    response.statusCode = 204;
    response.removeHeader("Content-Type");
    return response.end();
  }

  if (request.method === "GET" && request.url === "/v1/me") {
    if (!request.headers.authorization?.startsWith("Bearer ")) {
      return problem(response, 401, "AUTH_UNAUTHORIZED");
    }
    const accessTokenValue = request.headers.authorization.slice(
      "Bearer ".length,
    );
    return contractJson(
      response,
      200,
      "current user response",
      fixtureContracts.currentUserResponse,
      {
        data: tokenUsers.get(accessTokenValue) ?? me,
      },
    );
  }

  return problem(response, 404, "NOT_FOUND");
});

process.once("SIGINT", () => void stop(130));
process.once("SIGTERM", () => void stop(143));
process.once("uncaughtException", (error) => {
  console.error(error);
  void stop(1);
});
process.once("unhandledRejection", (error) => {
  console.error(error);
  void stop(1);
});

api.listen(apiPort, "127.0.0.1", () => {
  playwright = spawn(
    "pnpm",
    ["exec", "playwright", "test", ...process.argv.slice(2)],
    {
      env: {
        ...process.env,
        LAMARA_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
        LAMARA_SESSION_TTL_SECONDS: "3600",
        LAMARA_NEXT_DIST_DIR: ".next-e2e",
      },
      stdio: "inherit",
    },
  );
  playwright.once("exit", (code) => void stop(code ?? 1));
});

async function stop(exitCode) {
  if (stopping) return;
  stopping = true;

  if (playwright && playwright.exitCode === null) {
    playwright.kill("SIGTERM");
  }
  await new Promise((resolve) => api.close(resolve));
  process.exit(exitCode);
}

function accessToken(user = me) {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 300,
      jti: crypto.randomUUID(),
    }),
  ).toString("base64url");
  const value = `header.${payload}.signature`;
  tokenUsers.set(value, user);
  return value;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function json(response, status, body) {
  response.statusCode = status;
  response.end(JSON.stringify(body));
}

function contractJson(response, status, boundary, schema, body) {
  return json(response, status, parseFixtureContract(boundary, schema, body));
}

function problem(response, status, code) {
  return json(response, status, {
    type: "about:blank",
    title:
      status === 400
        ? "Bad Request"
        : status === 401
          ? "Unauthorized"
          : status === 409
            ? "Conflict"
            : status === 429
              ? "Too Many Requests"
              : "Not Found",
    status,
    code,
    traceId: response.getHeader("X-Request-Id"),
  });
}

const me = {
  accountDeletion: null,
  authMethods: ["PASSWORD"],
  email: "user@example.com",
  emailVerified: true,
  id: "e2e-user-id",
  profile: {
    displayName: "Example User",
    familyName: null,
    givenName: "Example",
    profileImageFileId: null,
  },
  roles: ["USER"],
};

const registeredMe = {
  ...me,
  email: "new-user@example.com",
  emailVerified: false,
  id: "e2e-registered-user-id",
  profile: {
    ...me.profile,
    displayName: "New User",
    givenName: "New",
  },
};

const tokenUsers = new Map();
