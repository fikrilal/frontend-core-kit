"use client";

import { useActionState } from "react";

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
  const feedbackId = state.error
    ? "email-verification-resend-error"
    : state.sent
      ? "email-verification-resend-success"
      : undefined;

  return (
    <form action={action} className="mt-4 grid gap-3">
      {state.sent ? (
        <p
          aria-live="polite"
          className="text-muted-foreground text-sm"
          id="email-verification-resend-success"
          role="status"
        >
          A new verification email is on its way. Check your inbox.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="email-verification-resend-error"
          role="alert"
        >
          {messageForEmailVerificationResendError(state.error)}
        </p>
      ) : null}
      <button
        aria-describedby={feedbackId}
        className="border-border bg-background hover:bg-muted/50 focus-visible:ring-foreground/25 h-10 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending
          ? "Sending verification email…"
          : state.sent
            ? "Send another verification email"
            : "Resend verification email"}
      </button>
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
