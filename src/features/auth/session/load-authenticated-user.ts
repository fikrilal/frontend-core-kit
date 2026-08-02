import "server-only";

import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { getCurrentUser, type CurrentUserData } from "../server/auth-api";

export type AuthenticatedUserResult =
  | Readonly<{ ok: true; user: CurrentUserData }>
  | Readonly<{ ok: false; reason: "unavailable" }>;

export async function loadAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  let currentUser = await getCurrentUser(access.accessToken);
  if (!currentUser.ok && currentUser.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }
    currentUser = await getCurrentUser(access.accessToken);
  }

  if (currentUser.ok) {
    return { ok: true, user: currentUser.data };
  }
  if (currentUser.status === 401) {
    await clearInvalidSession(sessionId);
    redirect("/login");
  }

  return { ok: false, reason: "unavailable" };
}

async function handleSessionFailure(
  access: Exclude<SessionAccessResult, { ok: true }>,
  sessionId: string,
): Promise<AuthenticatedUserResult> {
  if (access.reason === "unavailable") {
    return { ok: false, reason: "unavailable" };
  }

  await clearInvalidSession(sessionId);
  redirect("/login");
}

async function clearInvalidSession(sessionId: string): Promise<void> {
  await clearSessionCookie();
  try {
    await getConfiguredSessionService().clear(sessionId);
  } catch {
    // The browser session is already invalidated.
  }
}

async function readAccess(
  sessionId: string,
  forceRefresh = false,
): Promise<SessionAccessResult> {
  try {
    return await getConfiguredSessionService().getAccess(sessionId, {
      forceRefresh,
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
