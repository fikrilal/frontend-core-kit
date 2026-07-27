/**
 * Build a sealed Burnly session cookie for Playwright.
 * Sealing matches `src/server/auth/seal.ts` (JWE dir + A256GCM, SHA-256 key).
 * Must use the same SESSION_SECRET / cookie name as the Next app under test.
 */

import { CompactEncrypt } from "jose";
import type { BrowserContext } from "@playwright/test";

/** Same default as `src/server/config/env.ts` when SESSION_SECRET is unset. */
export const E2E_DEFAULT_SESSION_SECRET =
  "local-dev-only-burnly-session-secret-key!!";

export const E2E_SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "burnly_session";

export function e2eSessionSecret(): string {
  return process.env.SESSION_SECRET ?? E2E_DEFAULT_SESSION_SECRET;
}

function utf8Bytes(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "utf8"));
}

async function deriveKey(secret: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    utf8Bytes(secret).buffer as ArrayBuffer,
  );
  return new Uint8Array(digest);
}

async function sealJson(payload: unknown, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const plaintext = utf8Bytes(JSON.stringify(payload));
  return new CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(key);
}

/** Unsigned JWT-shaped access token with far-future exp (avoids refresh in e2e). */
export function e2eAccessToken(
  userId = "e2e-user",
  expUnix = Math.floor(Date.now() / 1000) + 60 * 60 * 24,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: expUnix }),
  ).toString("base64url");
  return `${header}.${payload}.e2e`;
}

export interface E2eSessionOptions {
  userId?: string;
  email?: string;
  secret?: string;
  cookieName?: string;
  /** Playwright base host without port, default 127.0.0.1 */
  domain?: string;
}

/**
 * Inject a valid sealed session cookie into the browser context.
 * Access token expiry is far in the future so getSession does not refresh.
 */
export async function addSignedInSessionCookie(
  context: BrowserContext,
  options: E2eSessionOptions = {},
): Promise<void> {
  const userId = options.userId ?? "e2e-user";
  const secret = options.secret ?? e2eSessionSecret();
  const cookieName = options.cookieName ?? E2E_SESSION_COOKIE_NAME;
  const domain = options.domain ?? "127.0.0.1";
  const accessToken = e2eAccessToken(userId);
  const accessExpiresAtMs = Date.now() + 60 * 60 * 24 * 1000;

  const sealed = await sealJson(
    {
      userId,
      tokens: {
        accessToken,
        refreshToken: "e2e-refresh-token",
        accessExpiresAtMs,
      },
    },
    secret,
  );

  await context.addCookies([
    {
      name: cookieName,
      value: sealed,
      domain,
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
