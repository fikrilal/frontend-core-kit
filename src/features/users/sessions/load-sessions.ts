import "server-only";

import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { listSessions, type SessionsListData } from "../server/users-api";
import { mapSessionsFailure, type SessionsError } from "./sessions-failure";

export type SessionsResult =
  | Readonly<{ ok: true; sessions: SessionsListData }>
  | Readonly<{ ok: false; error: SessionsError }>;

export async function loadSessions(): Promise<SessionsResult> {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  let result = await listSessions(access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await listSessions(access.accessToken);
  }

  if (result.ok) {
    return { ok: true, sessions: result.data };
  }
  if (result.status === 401) {
    await clearInvalidSession(sessionId);
    redirect("/login");
  }

  return { ok: false, error: mapSessionsFailure(result) };
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

async function handleSessionFailure(
  access: Exclude<SessionAccessResult, { ok: true }>,
  sessionId: string,
): Promise<SessionsResult> {
  if (access.reason === "unavailable") {
    return { ok: false, error: "unavailable" };
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
