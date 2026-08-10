"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
        <Alert
          aria-live="polite"
          className="bg-muted/35"
          id="cancel-account-deletion-success"
          role="status"
        >
          <AlertDescription>
            Your account deletion was canceled.
          </AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert
          aria-live="polite"
          id="cancel-account-deletion-error"
          variant="destructive"
        >
          <AlertDescription className="!text-destructive">
            Canceling account deletion is temporarily unavailable. Please try
            again.
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        disabled={pending || state.cancelled}
        type="submit"
        variant="outline"
      >
        {pending ? "Canceling deletion…" : "Cancel account deletion"}
      </Button>
    </form>
  );
}
