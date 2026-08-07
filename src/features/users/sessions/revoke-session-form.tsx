"use client";

import { useActionState } from "react";

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
  const feedbackId = state.error
    ? `revoke-session-error-${sessionId}`
    : state.revoked
      ? `revoke-session-success-${sessionId}`
      : undefined;

  return (
    <form action={action} className="grid justify-items-end gap-1">
      <input name="sessionId" type="hidden" value={sessionId} />
      {state.revoked ? (
        <p
          aria-live="polite"
          className="text-muted-foreground text-xs"
          id={`revoke-session-success-${sessionId}`}
          role="status"
        >
          Revoked.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-xs text-red-600 dark:text-red-400"
          id={`revoke-session-error-${sessionId}`}
          role="alert"
        >
          {messageForRevokeSessionError(state.error)}
        </p>
      ) : null}
      <button
        aria-describedby={feedbackId}
        className="border-border bg-background hover:bg-muted/50 focus-visible:ring-foreground/25 h-8 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.revoked}
        type="submit"
      >
        {pending ? "Revoking…" : "Revoke"}
      </button>
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
