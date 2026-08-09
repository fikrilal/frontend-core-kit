"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <Alert
        aria-live="polite"

        id="password-reset-success"
        role="status"
      >
        <AlertDescription>
          If an account exists for that email, you&apos;ll receive password
          reset instructions shortly.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="password-reset-email">Email</Label>
        <Input
          aria-describedby={state.error ? "password-reset-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="email"
          id="password-reset-email"
          name="email"
          required
          type="email"
        />
      </div>

      {state.error ? (
        <Alert
          aria-live="polite"
          id="password-reset-error"
          variant="destructive"
        >
          <AlertDescription className="text-destructive!">
            {messageForPasswordResetError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Sending instructions…" : "Send reset instructions"}
      </Button>
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
