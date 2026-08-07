export type RevokeSessionError = "notFound" | "invalidInput" | "unavailable";

export type RevokeSessionActionState = Readonly<{
  error: RevokeSessionError | null;
  revoked: boolean;
}>;
