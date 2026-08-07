export type RequestAccountDeletionError =
  "lastAdmin" | "conflict" | "unavailable";

export type RequestAccountDeletionActionState = Readonly<{
  error: RequestAccountDeletionError | null;
  requested: boolean;
}>;
