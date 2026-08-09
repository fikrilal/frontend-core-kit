"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
      <Button aria-describedby={errorId} disabled={pending} type="submit">
        {pending ? "Verifying email…" : "Verify email"}
      </Button>
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
    <Alert aria-live="polite" id={id} variant="destructive">
      <AlertDescription className="text-destructive!">
        {messageForEmailVerificationError(error)}
      </AlertDescription>
    </Alert>
  ) : null;
}

function InvalidVerificationLink() {
  return (
    <div className="grid gap-4">
      <Alert aria-live="polite" id="email-verification-error" role="status">
        <AlertDescription>
          This email verification link is invalid or expired. Return to sign in.
        </AlertDescription>
      </Alert>
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
