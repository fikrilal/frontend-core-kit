export type EmailVerificationError =
  "invalidInput" | "invalidToken" | "unavailable";

export type EmailVerificationActionState = Readonly<{
  error: EmailVerificationError | null;
}>;
