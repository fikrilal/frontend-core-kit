"use client";

import Link from "next/link";
import { useActionState } from "react";

import { verifyEmailAction } from "./email-verification-action";
import type {
  EmailVerificationActionState,
  EmailVerificationError,
} from "./email-verification-state";

const initialState: EmailVerificationActionState = { error: null };

export function EmailVerificationForm({
  token,
}: Readonly<{
  token: string | null;
}>) {
  return token ? (
    <VerificationForm token={token} />
  ) : (
    <InvalidVerificationLink />
  );
}

function VerificationForm({ token }: Readonly<{ token: string }>) {
  const [state, action, pending] = useActionState(
    verifyEmailAction,
    initialState,
  );
  const errorId = state.error ? "email-verification-error" : undefined;

  return (
    <form action={action} className="grid gap-5">
      <input name="token" type="hidden" value={token} />
      <p className="text-muted-foreground text-sm">
        Use the button below to verify the email address associated with your
        account.
      </p>
      <VerificationError error={state.error} id={errorId} />
      <button
        aria-describedby={errorId}
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/25 h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Verifying email…" : "Verify email"}
      </button>
    </form>
  );
}

function VerificationError({
  error,
  id,
}: Readonly<{
  error: EmailVerificationError | null;
  id: string | undefined;
}>) {
  return error ? (
    <p
      aria-live="polite"
      className="text-sm text-red-600 dark:text-red-400"
      id={id}
      role="alert"
    >
      {messageForEmailVerificationError(error)}
    </p>
  ) : null;
}

function InvalidVerificationLink() {
  return (
    <div className="grid gap-4">
      <p
        aria-live="polite"
        className="border-border bg-muted/35 text-muted-foreground rounded-lg border p-3 text-sm"
        id="email-verification-error"
        role="status"
      >
        This email verification link is invalid or expired. Return to sign in.
      </p>
      <Link
        className="text-foreground text-center text-sm font-medium underline"
        href="/login"
      >
        Return to sign in
      </Link>
    </div>
  );
}

function messageForEmailVerificationError(
  error: EmailVerificationError,
): string {
  switch (error) {
    case "invalidInput":
      return "This verification link is invalid. Return to sign in.";
    case "invalidToken":
      return "This email verification link is invalid or expired. Return to sign in.";
    case "unavailable":
      return "Email verification is temporarily unavailable. Please try again.";
  }
}
