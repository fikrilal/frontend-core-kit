"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { resendEmailVerificationAction } from "./email-verification-resend-action";
import type {
  EmailVerificationResendActionState,
  EmailVerificationResendError,
} from "./email-verification-resend-state";

const initialState: EmailVerificationResendActionState = {
  error: null,
  sent: false,
};

export function EmailVerificationResendForm() {
  const [state, action, pending] = useActionState(
    resendEmailVerificationAction,
    initialState,
  );

  return (
    <form action={action} className="mt-4 grid gap-3">
      {state.sent ? (
        <Alert
          aria-live="polite"

          id="email-verification-resend-success"
          role="status"
        >
          <AlertDescription>
            A new verification email is on its way. Check your inbox.
          </AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert
          aria-live="polite"
          id="email-verification-resend-error"
          variant="destructive"
        >
          <AlertDescription className="!text-destructive">
            {messageForEmailVerificationResendError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        className="border-border bg-background hover:bg-muted/50"
        disabled={pending}
        type="submit"
        variant="outline"
      >
        {pending
          ? "Sending verification email…"
          : state.sent
            ? "Send another verification email"
            : "Resend verification email"}
      </Button>
    </form>
  );
}

function messageForEmailVerificationResendError(
  error: EmailVerificationResendError,
): string {
  switch (error) {
    case "rateLimited":
      return "A verification email was requested recently. Please wait and try again.";
    case "unavailable":
      return "Verification email delivery is temporarily unavailable. Please try again.";
  }
}
