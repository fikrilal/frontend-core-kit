export type EmailVerificationResendError = "rateLimited" | "unavailable";

export type EmailVerificationResendActionState = Readonly<{
  error: EmailVerificationResendError | null;
  sent: boolean;
}>;
