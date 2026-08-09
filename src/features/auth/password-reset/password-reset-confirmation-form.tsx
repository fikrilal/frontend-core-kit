"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <div className="grid gap-2">
        <Label htmlFor="password-reset-confirmation-new-password">
          New password
        </Label>
        <Input
          aria-describedby={
            errorId ? `${passwordHintId} ${errorId}` : passwordHintId
          }
          aria-invalid={errorId ? true : undefined}
          autoComplete="new-password"
          id="password-reset-confirmation-new-password"
          minLength={10}
          name="newPassword"
          required
          type="password"
        />
        <p className="text-muted-foreground text-xs" id={passwordHintId}>
          Use at least 10 characters.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password-reset-confirmation-password">
          Confirm new password
        </Label>
        <Input
          aria-describedby={errorId}
          aria-invalid={errorId ? true : undefined}
          autoComplete="new-password"
          id="password-reset-confirmation-password"
          minLength={10}
          name="passwordConfirmation"
          required
          type="password"
        />
      </div>
      <ConfirmationError error={state.error} id={errorId} />
      <Button disabled={pending} type="submit">
        {pending ? "Updating password…" : "Update password"}
      </Button>
    </form>
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
    <Alert aria-live="polite" id={id} variant="destructive">
      <AlertDescription className="text-destructive!">
        {messageForPasswordResetConfirmationError(error)}
      </AlertDescription>
    </Alert>
  ) : null;
}

function InvalidResetLink() {
  return (
    <div className="grid gap-4">
      <Alert
        aria-live="polite"
        id="password-reset-confirmation-error"
        role="status"
      >
        <AlertDescription>
          This password reset link is invalid or expired. Request a new one.
        </AlertDescription>
      </Alert>
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
