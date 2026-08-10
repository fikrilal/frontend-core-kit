"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { clearProfileImage } from "../server/users-api";
import { mapClearProfileImageFailure } from "./clear-profile-image-failure";
import type { ClearProfileImageActionState } from "./clear-profile-image-state";

export async function clearProfileImageAction(
  _previousState: ClearProfileImageActionState,
  _formData: FormData,
): Promise<ClearProfileImageActionState> {
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

  let result = await clearProfileImage(access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await clearProfileImage(access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return {
      error: mapClearProfileImageFailure(),
      cleared: false,
    };
  }

  revalidatePath("/app/profile");
  return { error: null, cleared: true };
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
): Promise<ClearProfileImageActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", cleared: false };
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
