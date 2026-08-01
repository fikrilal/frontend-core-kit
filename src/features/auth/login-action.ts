"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { LoginActionState } from "./login-state";
import { establishAuthenticatedSession } from "./establish-authenticated-session";
import { loginWithPassword } from "./server/auth-api";
import { mapPasswordLoginFailure } from "./server/password-login-failure";

const loginInputSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
});

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const input = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!input.success) {
    return { error: "invalidInput" };
  }

  const result = await loginWithPassword(input.data);
  if (!result.ok) {
    return { error: mapPasswordLoginFailure(result) };
  }

  const sessionEstablished = await establishAuthenticatedSession({
    userId: result.data.user.id,
    accessToken: result.data.accessToken,
    refreshToken: result.data.refreshToken,
  });
  if (!sessionEstablished) {
    return {
      error: "unavailable",
    };
  }

  redirect("/app");
}
