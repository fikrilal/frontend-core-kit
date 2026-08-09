"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { revokeSessionAction } from "./revoke-session-action";
import type {
  RevokeSessionActionState,
  RevokeSessionError,
} from "./revoke-session-state";

const initialState: RevokeSessionActionState = {
  error: null,
  revoked: false,
};

type RevokeSessionFormProps = Readonly<{
  sessionId: string;
}>;

export function RevokeSessionForm({ sessionId }: RevokeSessionFormProps) {
  const [state, action, pending] = useActionState(
    revokeSessionAction,
    initialState,
  );

  return (
    <form action={action} className="grid justify-items-end gap-1">
      <input name="sessionId" type="hidden" value={sessionId} />
      {state.revoked ? (
        <Alert
          aria-live="polite"
          className="bg-muted/35 px-3 py-1.5 text-xs"
          id={`revoke-session-success-${sessionId}`}
          role="status"
        >
          <AlertDescription>Revoked.</AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert
          aria-live="polite"
          className="px-3 py-1.5 text-xs"
          id={`revoke-session-error-${sessionId}`}
          variant="destructive"
        >
          <AlertDescription className="text-destructive!">
            {messageForRevokeSessionError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        disabled={pending || state.revoked}
        size="sm"
        type="submit"
        variant="outline"
      >
        {pending ? "Revoking…" : "Revoke"}
      </Button>
    </form>
  );
}

function messageForRevokeSessionError(error: RevokeSessionError): string {
  switch (error) {
    case "notFound":
      return "This session no longer exists.";
    case "invalidInput":
      return "This session could not be revoked. Refresh and try again.";
    case "unavailable":
      return "Revoking is temporarily unavailable. Please try again.";
  }
}
