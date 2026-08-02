"use client";

import Link from "next/link";
import { useActionState } from "react";

import { confirmPasswordResetAction } from "./password-reset-confirmation-action";
import type {
  PasswordResetConfirmationActionState,
  PasswordResetConfirmationError,
} from "./password-reset-confirmation-state";

const initialState: PasswordResetConfirmationActionState = { error: null };

export function PasswordResetConfirmationForm({
  token,
}: Readonly<{
  token: string | null;
}>) {
  return token ? <ConfirmationForm token={token} /> : <InvalidResetLink />;
}

function ConfirmationForm({ token }: Readonly<{ token: string }>) {
  const [state, action, pending] = useActionState(
    confirmPasswordResetAction,
    initialState,
  );
  const errorId = state.error ? "password-reset-confirmation-error" : undefined;
  const passwordHintId = "password-reset-confirmation-password-hint";

  return (
    <form action={action} className="grid gap-5">
      <input name="token" type="hidden" value={token} />
      <PasswordInput
        ariaDescribedBy={
          errorId ? `${passwordHintId} ${errorId}` : passwordHintId
        }
        id="password-reset-confirmation-new-password"
        label="New password"
        name="newPassword"
      >
        <p className="text-muted-foreground text-xs" id={passwordHintId}>
          Use at least 10 characters.
        </p>
      </PasswordInput>
      <PasswordInput
        ariaDescribedBy={errorId}
        id="password-reset-confirmation-password"
        label="Confirm new password"
        name="passwordConfirmation"
      />
      <ConfirmationError error={state.error} id={errorId} />
      <button
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/25 h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}

function PasswordInput({
  ariaDescribedBy,
  children,
  id,
  label,
  name,
}: Readonly<{
  ariaDescribedBy?: string;
  children?: React.ReactNode;
  id: string;
  label: string;
  name: string;
}>) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaDescribedBy?.includes("error") ? true : undefined}
        autoComplete="new-password"
        className="border-border bg-background focus:border-foreground focus-visible:ring-foreground/25 h-10 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        id={id}
        minLength={10}
        name={name}
        required
        type="password"
      />
      {children}
    </div>
  );
}

function ConfirmationError({
  error,
  id,
}: Readonly<{
  error: PasswordResetConfirmationError | null;
  id: string | undefined;
}>) {
  return error ? (
    <p
      aria-live="polite"
      className="text-sm text-red-600 dark:text-red-400"
      id={id}
    >
      {messageForPasswordResetConfirmationError(error)}
    </p>
  ) : null;
}

function InvalidResetLink() {
  return (
    <div className="grid gap-4">
      <p
        aria-live="polite"
        className="border-border bg-muted/35 text-muted-foreground rounded-lg border p-3 text-sm"
        id="password-reset-confirmation-error"
        role="status"
      >
        This password reset link is invalid or expired. Request a new one.
      </p>
      <Link
        className="text-foreground text-center text-sm font-medium underline"
        href="/forgot-password"
      >
        Request a new reset link
      </Link>
    </div>
  );
}

function messageForPasswordResetConfirmationError(
  error: PasswordResetConfirmationError,
): string {
  switch (error) {
    case "invalidInput":
      return "Enter a matching password of at least 10 characters.";
    case "invalidToken":
      return "This password reset link is invalid or expired. Request a new one.";
    case "unavailable":
      return "Password reset is temporarily unavailable. Please try again.";
  }
}
