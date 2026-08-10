"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { passwordRegisterRequestDtoPasswordMin } from "@/contracts/example-api/runtime";

import { establishAuthenticatedSession } from "../session/establish-authenticated-session";
import type { RegisterActionState } from "./register-state";
import {
  registerWithPassword,
  type PasswordRegisterInput,
} from "../server/auth-api";
import { mapPasswordRegisterFailure } from "./password-register-failure";

const registerInputSchema = z
  .object({
    email: z.email().trim(),
    password: z.string().min(passwordRegisterRequestDtoPasswordMin),
    passwordConfirmation: z.string(),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    path: ["passwordConfirmation"],
  });

export async function registerAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const input = registerInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!input.success) {
    return { error: "invalidInput" };
  }

  const request: PasswordRegisterInput = {
    email: input.data.email,
    password: input.data.password,
  };
  const result = await registerWithPassword(request);
  if (!result.ok) {
    return { error: mapPasswordRegisterFailure(result) };
  }

  const sessionEstablished = await establishAuthenticatedSession({
    userId: result.data.user.id,
    accessToken: result.data.accessToken,
    refreshToken: result.data.refreshToken,
  });
  if (!sessionEstablished) {
    return { error: "unavailable" };
  }

  redirect("/app");
}
