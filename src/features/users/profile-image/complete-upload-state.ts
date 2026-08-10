export type CompleteProfileImageUploadError =
  "notFound" | "mismatch" | "unavailable";

export type CompleteProfileImageUploadActionState = Readonly<{
  error: CompleteProfileImageUploadError | null;
  completed: boolean;
}>;
