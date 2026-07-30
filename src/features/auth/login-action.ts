"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getConfiguredSessionService,
  readSessionCookie,
  writeSessionCookie,
} from "@/server/session";

import type { LoginActionState } from "./login-state";
import { loginWithPassword, logoutRemoteSession } from "./server/auth-api";
import { mapPasswordLoginFailure } from "./server/password-login-failure";

const loginInputSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
});

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const input = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!input.success) {
    return { error: "invalidInput" };
  }

  const result = await loginWithPassword(input.data);
  if (!result.ok) {
    return { error: mapPasswordLoginFailure(result) };
  }

  const sessions = getConfiguredSessionService();
  const previousSessionId = await readSessionCookie();
  let createdSessionId: string | null = null;

  try {
    const session = await sessions.establish({
      userId: result.data.user.id,
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
    });
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
      await logoutRemoteSession(result.data.refreshToken);
    } catch {
      // The local session was not created, so there is nothing else to clear.
    }
    return {
      error: "unavailable",
    };
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

  redirect("/app");
}
