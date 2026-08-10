"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { changePasswordRequestDtoNewPasswordMin } from "@/contracts/example-api/runtime";

import { changePasswordAction } from "./change-password-action";
import type {
  ChangePasswordActionState,
  ChangePasswordError,
} from "./change-password-state";

const initialState: ChangePasswordActionState = {
  error: null,
  changed: false,
};

type PasswordFieldProps = Readonly<{
  autoComplete: string;
  describedBy?: string;
  error?: boolean;
  id: string;
  label: string;
  minLength?: number;
  name: string;
}>;

function PasswordField({
  autoComplete,
  describedBy,
  error,
  id,
  label,
  minLength,
  name,
}: PasswordFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        id={id}
        minLength={minLength}
        name={name}
        required
        type="password"
      />
    </div>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    initialState,
  );
  const describedBy = state.error ? "change-password-error" : undefined;

  return (
    <form action={action} className="grid gap-5">
      <PasswordField
        autoComplete="current-password"
        describedBy={describedBy}
        error={state.error ? true : undefined}
        id="current-password"
        label="Current password"
        name="currentPassword"
      />
      <PasswordField
        autoComplete="new-password"
        describedBy={describedBy}
        error={state.error ? true : undefined}
        id="new-password"
        label="New password"
        minLength={changePasswordRequestDtoNewPasswordMin}
        name="newPassword"
      />
      <PasswordField
        autoComplete="new-password"
        describedBy={describedBy}
        error={state.error ? true : undefined}
        id="new-password-confirmation"
        label="Confirm new password"
        minLength={changePasswordRequestDtoNewPasswordMin}
        name="newPasswordConfirmation"
      />

      {state.changed ? (
        <Alert
          aria-live="polite"

          id="change-password-success"
          role="status"
        >
          <AlertDescription>Your password was changed.</AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert
          aria-live="polite"
          id="change-password-error"
          variant="destructive"
        >
          <AlertDescription className="text-destructive!">
            {messageForChangePasswordError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Changing password…" : "Change password"}
      </Button>
    </form>
  );
}

function messageForChangePasswordError(error: ChangePasswordError): string {
  switch (error) {
    case "invalidCurrentPassword":
      return "The current password is incorrect.";
    case "passwordNotSet":
      return "Your account does not have a password yet. Use a different sign-in method or contact support.";
    case "conflict":
      return "Your password could not be changed. Refresh and try again.";
    case "invalidInput":
      return "Enter your current password and a matching new password of at least 10 characters.";
    case "unavailable":
      return "Changing your password is temporarily unavailable. Please try again.";
  }
}
