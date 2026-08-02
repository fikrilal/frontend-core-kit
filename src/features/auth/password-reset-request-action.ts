"use server";

import { z } from "zod";

import type { PasswordResetRequestActionState } from "./password-reset-request-state";
import { requestPasswordReset } from "./server/auth-api";
import { mapPasswordResetRequestFailure } from "./server/password-reset-request-failure";

const passwordResetRequestInputSchema = z.object({
  email: z.string().trim().pipe(z.email()),
});

export async function requestPasswordResetAction(
  _previousState: PasswordResetRequestActionState,
  formData: FormData,
): Promise<PasswordResetRequestActionState> {
  const input = passwordResetRequestInputSchema.safeParse({
    email: formData.get("email"),
  });
  if (!input.success) {
    return { error: "invalidInput", sent: false };
  }

  const result = await requestPasswordReset(input.data);
  if (!result.ok) {
    return {
      error: mapPasswordResetRequestFailure(result),
      sent: false,
    };
  }

  return { error: null, sent: true };
}
