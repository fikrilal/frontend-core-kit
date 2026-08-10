import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { readSessionConfig } from "@/server/config/env";

import type { EstablishedSession } from "./session-service";

const sessionCookieName = "frontend_core_session";

const sessionIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "invalid session identifier");

export async function readSessionCookie(): Promise<string | null> {
  const value = (await cookies()).get(sessionCookieName)?.value;
  if (!value) {
    return null;
  }

  const parsed = sessionIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function writeSessionCookie(
  session: EstablishedSession,
): Promise<void> {
  const config = readSessionConfig();
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, session.sessionId, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const config = readSessionConfig();
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
