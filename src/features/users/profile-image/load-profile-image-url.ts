import "server-only";

import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import {
  getProfileImageUrl,
  type ProfileImageUrlData,
} from "../server/users-api";
import {
  mapProfileImageUrlFailure,
  type ProfileImageUrlError,
} from "./profile-image-url-failure";

export type ProfileImageUrlResult =
  | Readonly<{ ok: true; imageUrl: ProfileImageUrlData | null }>
  | Readonly<{ ok: false; error: ProfileImageUrlError }>;

export async function loadProfileImageUrl(): Promise<ProfileImageUrlResult> {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  let result = await getProfileImageUrl(access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await getProfileImageUrl(access.accessToken);
  }

  if (result.ok) {
    return { ok: true, imageUrl: result.data };
  }
  if (result.status === 401) {
    await clearInvalidSession(sessionId);
    redirect("/login");
  }

  return { ok: false, error: mapProfileImageUrlFailure() };
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
): Promise<ProfileImageUrlResult> {
  if (access.reason === "unavailable") {
    return { ok: false, error: "unavailable" };
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
