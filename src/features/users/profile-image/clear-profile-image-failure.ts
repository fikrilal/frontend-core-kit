import "server-only";

import type { ClearProfileImageError } from "./clear-profile-image-state";

export function mapClearProfileImageFailure(): ClearProfileImageError {
  return "unavailable";
}
