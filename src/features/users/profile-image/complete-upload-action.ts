"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { completeProfileImageUpload } from "../server/users-api";
import { mapCompleteProfileImageUploadFailure } from "./complete-upload-failure";
import type { CompleteProfileImageUploadActionState } from "./complete-upload-state";

const completeUploadInputSchema = z.object({
  fileId: z.string().min(1),
});

export async function completeProfileImageUploadAction(
  _previousState: CompleteProfileImageUploadActionState,
  formData: FormData,
): Promise<CompleteProfileImageUploadActionState> {
  const input = completeUploadInputSchema.safeParse({
    fileId: formData.get("fileId"),
  });
  if (!input.success) {
    return { error: "mismatch", completed: false };
  }

  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  const request = { fileId: input.data.fileId };

  let result = await completeProfileImageUpload(request, access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await completeProfileImageUpload(request, access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return {
      error: mapCompleteProfileImageUploadFailure(result),
      completed: false,
    };
  }

  revalidatePath("/app/profile");
  return { error: null, completed: true };
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
): Promise<CompleteProfileImageUploadActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", completed: false };
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
