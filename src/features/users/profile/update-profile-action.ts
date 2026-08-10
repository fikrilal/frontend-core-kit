"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  patchMeProfileDtoDisplayNameMax,
  patchMeProfileDtoFamilyNameMax,
  patchMeProfileDtoGivenNameMax,
} from "@/contracts/example-api/runtime";
import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
  type SessionAccessResult,
} from "@/server/session";

import { patchCurrentUser, type PatchMeInput } from "../server/users-api";
import { mapUpdateProfileFailure } from "./update-profile-failure";
import type { UpdateProfileActionState } from "./update-profile-state";

const updateProfileInputSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .max(patchMeProfileDtoDisplayNameMax)
      .nullish(),
    givenName: z.string().trim().max(patchMeProfileDtoGivenNameMax).nullish(),
    familyName: z.string().trim().max(patchMeProfileDtoFamilyNameMax).nullish(),
  })
  .refine((input) => {
    const values = [input.displayName, input.givenName, input.familyName];
    return values.some((value) => value !== undefined);
  }, "At least one profile field is required");

export async function updateProfileAction(
  _previousState: UpdateProfileActionState,
  formData: FormData,
): Promise<UpdateProfileActionState> {
  void _previousState;

  const input = updateProfileInputSchema.safeParse({
    displayName: emptyToUndefined(formData.get("displayName")),
    givenName: emptyToUndefined(formData.get("givenName")),
    familyName: emptyToUndefined(formData.get("familyName")),
  });
  if (!input.success) {
    return { error: "invalidInput", saved: false, profile: null };
  }

  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/login");
  }

  let access = await readAccess(sessionId);
  if (!access.ok) {
    return handleSessionFailure(access, sessionId);
  }

  const request: PatchMeInput = {
    profile: {
      displayName: input.data.displayName,
      givenName: input.data.givenName,
      familyName: input.data.familyName,
    },
  };

  let result = await patchCurrentUser(request, access.accessToken);
  if (!result.ok && result.status === 401) {
    access = await readAccess(sessionId, true);
    if (!access.ok) {
      return handleSessionFailure(access, sessionId);
    }

    result = await patchCurrentUser(request, access.accessToken);
  }

  if (!result.ok) {
    if (result.status === 401) {
      await clearInvalidSession(sessionId);
      redirect("/login");
    }

    return {
      error: mapUpdateProfileFailure(result),
      saved: false,
      profile: null,
    };
  }

  return {
    error: null,
    saved: true,
    profile: {
      displayName: result.data.profile.displayName ?? null,
      givenName: result.data.profile.givenName ?? null,
      familyName: result.data.profile.familyName ?? null,
    },
  };
}

function emptyToUndefined(
  value: FormDataEntryValue | null,
): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return value;
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
): Promise<UpdateProfileActionState> {
  if (access.reason === "unavailable") {
    return { error: "unavailable", saved: false, profile: null };
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
