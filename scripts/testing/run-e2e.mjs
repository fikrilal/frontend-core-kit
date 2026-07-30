#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import process from "node:process";

const apiPort = 4_400;
let playwright;
let stopping = false;

const api = createServer(async (request, response) => {
  const requestId = request.headers["x-request-id"] ?? crypto.randomUUID();
  response.setHeader("Content-Type", "application/json");
  response.setHeader("X-Request-Id", requestId);

  if (request.method === "POST" && request.url === "/v1/auth/password/login") {
    const body = await readJson(request);
    if (
      body?.email !== "user@example.com" ||
      body?.password !== "test-password"
    ) {
      return problem(response, 401, "AUTH_INVALID_CREDENTIALS");
    }

    return json(response, 200, {
      data: {
        accessToken: accessToken(),
        refreshToken: "e2e-refresh-token",
        user: me,
      },
    });
  }

  if (request.method === "POST" && request.url === "/v1/auth/refresh") {
    return json(response, 200, {
      data: {
        accessToken: accessToken(),
        refreshToken: "e2e-rotated-refresh-token",
        user: {
          id: me.id,
          email: me.email,
          emailVerified: me.emailVerified,
        },
      },
    });
  }

  if (request.method === "POST" && request.url === "/v1/auth/logout") {
    response.statusCode = 204;
    response.removeHeader("Content-Type");
    return response.end();
  }

  if (request.method === "GET" && request.url === "/v1/me") {
    if (!request.headers.authorization?.startsWith("Bearer ")) {
      return problem(response, 401, "AUTH_UNAUTHORIZED");
    }
    return json(response, 200, { data: me });
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
  playwright = spawn("pnpm", ["exec", "playwright", "test"], {
    env: {
      ...process.env,
      LAMARA_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
      LAMARA_SESSION_TTL_SECONDS: "3600",
      LAMARA_NEXT_DIST_DIR: ".next-e2e",
    },
    stdio: "inherit",
  });
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

function accessToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 }),
  ).toString("base64url");
  return `header.${payload}.signature`;
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

function problem(response, status, code) {
  return json(response, status, {
    type: "about:blank",
    title: status === 401 ? "Unauthorized" : "Not Found",
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
