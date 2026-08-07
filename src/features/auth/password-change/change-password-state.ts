export type ChangePasswordError =
  | "invalidCurrentPassword"
  | "passwordNotSet"
  | "conflict"
  | "invalidInput"
  | "unavailable";

export type ChangePasswordActionState = Readonly<{
  error: ChangePasswordError | null;
  changed: boolean;
}>;
