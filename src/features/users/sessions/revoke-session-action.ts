"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { revokeSession } from "../server/users-api";
import { mapRevokeSessionFailure } from "./revoke-session-failure";
import type { RevokeSessionActionState } from "./revoke-session-state";

const revokeSessionInputSchema = z.object({
  sessionId: z.string().min(1),
});

export async function revokeSessionAction(
  _previousState: RevokeSessionActionState,
  formData: FormData,
): Promise<RevokeSessionActionState> {
  const input = revokeSessionInputSchema.safeParse({
    sessionId: formData.get("sessionId"),
  });
  if (!input.success) {
    return { error: "invalidInput", revoked: false };
  }

  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  let result = await revokeSession(input.data.sessionId, access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await revokeSession(input.data.sessionId, access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return { error: mapRevokeSessionFailure(result), revoked: false };
  }

  return { error: null, revoked: true };
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
): Promise<RevokeSessionActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", revoked: false };
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
