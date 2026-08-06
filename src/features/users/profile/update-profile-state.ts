export type UpdateProfileError = "invalidInput" | "conflict" | "unavailable";

export type UpdateProfileProfile = Readonly<{
  displayName: string | null;
  givenName: string | null;
  familyName: string | null;
}>;

export type UpdateProfileActionState = Readonly<{
  error: UpdateProfileError | null;
  saved: boolean;
  profile: UpdateProfileProfile | null;
}>;
