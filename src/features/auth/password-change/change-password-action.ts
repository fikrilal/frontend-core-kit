"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { changePasswordRequestDtoNewPasswordMin } from "@/contracts/lamara-api/runtime";
import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { changePassword, type PasswordChangeInput } from "../server/auth-api";
import { mapChangePasswordFailure } from "./change-password-failure";
import type { ChangePasswordActionState } from "./change-password-state";

const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(changePasswordRequestDtoNewPasswordMin),
    newPasswordConfirmation: z.string(),
  })
  .refine((input) => input.newPassword === input.newPasswordConfirmation, {
    path: ["newPasswordConfirmation"],
  });

export async function changePasswordAction(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const input = changePasswordInputSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    newPasswordConfirmation: formData.get("newPasswordConfirmation"),
  });
  if (!input.success) {
    return { error: "invalidInput", changed: false };
  }

  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  const request: PasswordChangeInput = {
    currentPassword: input.data.currentPassword,
    newPassword: input.data.newPassword,
  };

  let result = await changePassword(request, access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await changePassword(request, access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return { error: mapChangePasswordFailure(result), changed: false };
  }

  return { error: null, changed: true };
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
): Promise<ChangePasswordActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", changed: false };
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
