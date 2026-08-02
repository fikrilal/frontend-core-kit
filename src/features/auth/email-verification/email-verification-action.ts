"use server";

import { redirect } from "next/navigation";

import { VerifyEmailRequestDto } from "@/contracts/lamara-api/runtime";

import type { EmailVerificationActionState } from "./email-verification-state";
import { verifyEmail } from "../server/auth-api";
import { mapEmailVerificationFailure } from "./email-verification-failure";

const emailVerificationInputSchema = VerifyEmailRequestDto.extend({
  // The backend DTO requires one character, but the generated OpenAPI schema
  // does not currently carry that minLength constraint.
  token: VerifyEmailRequestDto.shape.token.min(1),
});

export async function verifyEmailAction(
  _previousState: EmailVerificationActionState,
  formData: FormData,
): Promise<EmailVerificationActionState> {
  const input = emailVerificationInputSchema.safeParse({
    token: formData.get("token"),
  });
  if (!input.success) {
    return { error: "invalidInput" };
  }

  const result = await verifyEmail({ token: input.data.token });
  if (!result.ok) {
    return { error: mapEmailVerificationFailure(result) };
  }

  redirect("/login?verified=success");
}
