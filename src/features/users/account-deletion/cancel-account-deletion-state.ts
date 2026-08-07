export type CancelAccountDeletionError = "unavailable";

export type CancelAccountDeletionActionState = Readonly<{
  error: CancelAccountDeletionError | null;
  cancelled: boolean;
}>;
