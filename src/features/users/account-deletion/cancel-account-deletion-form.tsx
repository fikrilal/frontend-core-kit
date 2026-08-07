"use client";

import { useActionState } from "react";

import { cancelAccountDeletionAction } from "./cancel-account-deletion-action";
import type { CancelAccountDeletionActionState } from "./cancel-account-deletion-state";

const initialState: CancelAccountDeletionActionState = {
  error: null,
  cancelled: false,
};

export function CancelAccountDeletionForm() {
  const [state, action, pending] = useActionState(
    cancelAccountDeletionAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-3">
      {state.cancelled ? (
        <p
          aria-live="polite"
          className="text-muted-foreground text-sm"
          id="cancel-account-deletion-success"
          role="status"
        >
          Your account deletion was canceled.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="cancel-account-deletion-error"
        >
          Canceling account deletion is temporarily unavailable. Please try
          again.
        </p>
      ) : null}
      <button
        className="border-border bg-background hover:bg-muted/50 focus-visible:ring-foreground/25 h-10 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.cancelled}
        type="submit"
      >
        {pending ? "Canceling deletion…" : "Cancel account deletion"}
      </button>
    </form>
  );
}
