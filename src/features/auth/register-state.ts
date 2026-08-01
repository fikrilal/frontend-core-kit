export type RegisterError =
  "emailAlreadyExists" | "invalidInput" | "unavailable";

export type RegisterActionState = Readonly<{
  error: RegisterError | null;
}>;
