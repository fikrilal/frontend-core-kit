"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createProfileImageUploadRequestDtoSizeBytesMax } from "@/contracts/example-api/runtime";
import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import {
  createProfileImageUploadPlan,
  type ProfileImageUploadInput,
} from "../server/users-api";
import { mapProfileImageUploadFailure } from "./upload-plan-failure";
import type { ProfileImageUploadActionState } from "./upload-plan-state";

const uploadPlanInputSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.coerce
    .number()
    .int()
    .min(1)
    .max(createProfileImageUploadRequestDtoSizeBytesMax),
});

export async function createProfileImageUploadPlanAction(
  _previousState: ProfileImageUploadActionState,
  formData: FormData,
): Promise<ProfileImageUploadActionState> {
  const input = uploadPlanInputSchema.safeParse({
    contentType: formData.get("contentType"),
    sizeBytes: formData.get("sizeBytes"),
  });
  if (!input.success) {
    return { error: "invalidInput", plan: null };
  }

  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  const request: ProfileImageUploadInput = {
    contentType: input.data.contentType,
    sizeBytes: input.data.sizeBytes,
  };

  let result = await createProfileImageUploadPlan(request, access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await createProfileImageUploadPlan(request, access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return { error: mapProfileImageUploadFailure(result), plan: null };
  }

  return {
    error: null,
    plan: {
      fileId: result.data.fileId,
      uploadUrl: result.data.upload.url,
      uploadHeaders: result.data.upload.headers,
      expiresAt: result.data.expiresAt,
    },
  };
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
): Promise<ProfileImageUploadActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", plan: null };
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
