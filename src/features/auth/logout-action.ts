"use server";

import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getConfiguredSessionService,
  readSessionCookie,
} from "@/server/session";

import { logoutRemoteSession } from "./server/auth-api";

export async function logoutAction(): Promise<never> {
  const sessionId = await readSessionCookie();
  await clearSessionCookie();

  if (sessionId) {
    try {
      const record = await getConfiguredSessionService().clear(sessionId);
      if (record) {
        await logoutRemoteSession(record.refreshToken);
      }
    } catch {
      // The browser session is cleared even when the API is unavailable.
    }
  }

  redirect("/login");
}
