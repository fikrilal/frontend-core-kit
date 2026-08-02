export type PasswordResetConfirmationError =
  "invalidInput" | "invalidToken" | "unavailable";

export type PasswordResetConfirmationActionState = Readonly<{
  error: PasswordResetConfirmationError | null;
}>;
