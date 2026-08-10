export type ClearProfileImageError = "unavailable";

export type ClearProfileImageActionState = Readonly<{
  error: ClearProfileImageError | null;
  cleared: boolean;
}>;
