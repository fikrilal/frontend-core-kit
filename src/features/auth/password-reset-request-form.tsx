"use client";

import { useActionState } from "react";

import { requestPasswordResetAction } from "./password-reset-request-action";
import type {
  PasswordResetRequestActionState,
  PasswordResetRequestError,
} from "./password-reset-request-state";

const initialState: PasswordResetRequestActionState = {
  error: null,
  sent: false,
};

export function PasswordResetRequestForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state.sent) {
    return (
      <div className="grid gap-4">
        <p
          aria-live="polite"
          className="border-border bg-muted/35 text-muted-foreground rounded-lg border p-3 text-sm"
          id="password-reset-success"
          role="status"
        >
          If an account exists for that email, you&apos;ll receive password
          reset instructions shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="password-reset-email">
          Email
        </label>
        <input
          aria-describedby={state.error ? "password-reset-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="email"
          className="border-border bg-background focus:border-foreground focus-visible:ring-foreground/25 h-10 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          id="password-reset-email"
          name="email"
          required
          type="email"
        />
      </div>

      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="password-reset-error"
        >
          {messageForPasswordResetError(state.error)}
        </p>
      ) : null}

      <button
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/25 h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Sending instructions…" : "Send reset instructions"}
      </button>
    </form>
  );
}

function messageForPasswordResetError(
  error: PasswordResetRequestError,
): string {
  switch (error) {
    case "invalidInput":
      return "Enter a valid email address.";
    case "rateLimited":
      return "Too many requests. Please wait and try again.";
    case "unavailable":
      return "Password reset is temporarily unavailable. Please try again.";
  }
}
