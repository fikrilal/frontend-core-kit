"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { requestAccountDeletion } from "../server/users-api";
import { mapRequestAccountDeletionFailure } from "./request-account-deletion-failure";
import type { RequestAccountDeletionActionState } from "./request-account-deletion-state";

export async function requestAccountDeletionAction(
  _previousState: RequestAccountDeletionActionState,
  _formData: FormData,
): Promise<RequestAccountDeletionActionState> {
  void _previousState;
  void _formData;

  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  let result = await requestAccountDeletion(access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await requestAccountDeletion(access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return {
      error: mapRequestAccountDeletionFailure(result),
      requested: false,
    };
  }

  revalidatePath("/app/account-deletion");
  return { error: null, requested: true };
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
): Promise<RequestAccountDeletionActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", requested: false };
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
