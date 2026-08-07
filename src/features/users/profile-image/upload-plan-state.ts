export type ProfileImageUploadError =
  "rateLimited" | "conflict" | "invalidInput" | "unavailable";

export type ProfileImageUploadPlan = Readonly<{
  fileId: string;
  uploadUrl: string;
  uploadHeaders: Readonly<Record<string, string>>;
  expiresAt: string;
}>;

export type ProfileImageUploadActionState = Readonly<{
  error: ProfileImageUploadError | null;
  plan: ProfileImageUploadPlan | null;
}>;
