"use client";

import { useActionState } from "react";

import { requestAccountDeletionAction } from "./request-account-deletion-action";
import type {
  RequestAccountDeletionActionState,
  RequestAccountDeletionError,
} from "./request-account-deletion-state";

const initialState: RequestAccountDeletionActionState = {
  error: null,
  requested: false,
};

export function RequestAccountDeletionForm() {
  const [state, action, pending] = useActionState(
    requestAccountDeletionAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-3">
      {state.requested ? (
        <p
          aria-live="polite"
          className="text-muted-foreground text-sm"
          id="request-account-deletion-success"
          role="status"
        >
          Your account deletion was scheduled. You can cancel it within 30 days.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="request-account-deletion-error"
        >
          {messageForRequestAccountDeletionError(state.error)}
        </p>
      ) : null}
      <button
        className="border-border bg-background hover:bg-muted/50 focus-visible:ring-foreground/25 h-10 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.requested}
        type="submit"
      >
        {pending ? "Scheduling deletion…" : "Request account deletion"}
      </button>
    </form>
  );
}

function messageForRequestAccountDeletionError(
  error: RequestAccountDeletionError,
): string {
  switch (error) {
    case "lastAdmin":
      return "Your account is the last administrator and cannot be deleted.";
    case "conflict":
      return "An account deletion request is already in progress.";
    case "unavailable":
      return "Account deletion is temporarily unavailable. Please try again.";
  }
}
