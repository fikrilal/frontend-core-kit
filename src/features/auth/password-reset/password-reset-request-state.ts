export type PasswordResetRequestError =
  "invalidInput" | "rateLimited" | "unavailable";

export type PasswordResetRequestActionState = Readonly<{
  error: PasswordResetRequestError | null;
  sent: boolean;
}>;
