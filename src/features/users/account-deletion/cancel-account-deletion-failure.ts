import "server-only";

import type { CancelAccountDeletionError } from "./cancel-account-deletion-state";

export function mapCancelAccountDeletionFailure(): CancelAccountDeletionError {
  return "unavailable";
}
