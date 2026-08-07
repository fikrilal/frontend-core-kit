"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { cancelAccountDeletion } from "../server/users-api";
import { mapCancelAccountDeletionFailure } from "./cancel-account-deletion-failure";
import type { CancelAccountDeletionActionState } from "./cancel-account-deletion-state";

export async function cancelAccountDeletionAction(
  _previousState: CancelAccountDeletionActionState,
  _formData: FormData,
): Promise<CancelAccountDeletionActionState> {
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

  let result = await cancelAccountDeletion(access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await cancelAccountDeletion(access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return {
      error: mapCancelAccountDeletionFailure(),
      cancelled: false,
    };
  }

  revalidatePath("/app/account-deletion");
  return { error: null, cancelled: true };
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
): Promise<CancelAccountDeletionActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", cancelled: false };
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
