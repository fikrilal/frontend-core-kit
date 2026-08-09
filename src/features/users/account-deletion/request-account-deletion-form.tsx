"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
        <Alert
          aria-live="polite"
          className="bg-muted/35"
          id="request-account-deletion-success"
          role="status"
        >
          <AlertDescription>
            Your account deletion was scheduled. You can cancel it within 30
            days.
          </AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert
          aria-live="polite"
          id="request-account-deletion-error"
          variant="destructive"
        >
          <AlertDescription className="text-destructive!">
            {messageForRequestAccountDeletionError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        disabled={pending || state.requested}
        type="submit"
        variant="outline"
      >
        {pending ? "Scheduling deletion…" : "Request account deletion"}
      </Button>
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
