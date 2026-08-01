import "server-only";

import {
  getConfiguredSessionService,
  readSessionCookie,
  writeSessionCookie,
} from "@/server/session";

import { logoutRemoteSession } from "./server/auth-api";

export type AuthSessionInput = Readonly<{
  userId: string;
  accessToken: string;
  refreshToken: string;
}>;

export async function establishAuthenticatedSession(
  input: AuthSessionInput,
): Promise<boolean> {
  const sessions = getConfiguredSessionService();
  const previousSessionId = await readSessionCookie();
  let createdSessionId: string | null = null;

  try {
    const session = await sessions.establish(input);
    createdSessionId = session.sessionId;
    await writeSessionCookie(session);
  } catch {
    if (createdSessionId) {
      try {
        await sessions.clear(createdSessionId);
      } catch {
        // The unreachable record expires at the configured absolute TTL.
      }
    }
    try {
      await logoutRemoteSession(input.refreshToken);
    } catch {
      // The local session was not created, so there is nothing else to clear.
    }
    return false;
  }

  if (previousSessionId && previousSessionId !== createdSessionId) {
    try {
      const previous = await sessions.clear(previousSessionId);
      if (previous) {
        await logoutRemoteSession(previous.refreshToken);
      }
    } catch {
      // The new session is established; stale state expires at its absolute TTL.
    }
  }

  return true;
}
