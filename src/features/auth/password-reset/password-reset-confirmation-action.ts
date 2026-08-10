"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { PasswordResetConfirmRequestDto } from "@/contracts/example-api/runtime";

import type { PasswordResetConfirmationActionState } from "./password-reset-confirmation-state";
import { confirmPasswordReset } from "../server/auth-api";
import { mapPasswordResetConfirmationFailure } from "./password-reset-confirmation-failure";

const passwordResetConfirmationInputSchema =
  PasswordResetConfirmRequestDto.extend({
    token: z.string().min(1),
    passwordConfirmation: z.string(),
  }).refine((input) => input.newPassword === input.passwordConfirmation, {
    path: ["passwordConfirmation"],
  });

export async function confirmPasswordResetAction(
  _previousState: PasswordResetConfirmationActionState,
  formData: FormData,
): Promise<PasswordResetConfirmationActionState> {
  const input = passwordResetConfirmationInputSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!input.success) {
    return { error: "invalidInput" };
  }

  const result = await confirmPasswordReset({
    token: input.data.token,
    newPassword: input.data.newPassword,
  });
  if (!result.ok) {
    return { error: mapPasswordResetConfirmationFailure(result) };
  }

  redirect("/login?reset=success");
}
