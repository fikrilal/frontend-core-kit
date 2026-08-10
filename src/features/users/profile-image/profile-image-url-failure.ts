import "server-only";

export type ProfileImageUrlError = "unavailable";

export function mapProfileImageUrlFailure(): ProfileImageUrlError {
  return "unavailable";
}
