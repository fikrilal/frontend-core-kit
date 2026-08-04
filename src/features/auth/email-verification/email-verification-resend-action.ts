"use server";

import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { resendEmailVerification } from "../server/auth-api";
import { mapEmailVerificationResendFailure } from "./email-verification-resend-failure";
import type { EmailVerificationResendActionState } from "./email-verification-resend-state";

export async function resendEmailVerificationAction(
  _previousState: EmailVerificationResendActionState,
  _formData: FormData,
): Promise<EmailVerificationResendActionState> {
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

  let result = await resendEmailVerification(access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await resendEmailVerification(access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return {
      error: mapEmailVerificationResendFailure(result),
      sent: false,
    };
  }

  return { error: null, sent: true };
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
): Promise<EmailVerificationResendActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", sent: false };
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
