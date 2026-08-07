"use client";

import { useActionState } from "react";

import { changePasswordRequestDtoNewPasswordMin } from "@/contracts/lamara-api/runtime";

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
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        className="border-border bg-background focus:border-foreground focus-visible:ring-foreground/25 h-10 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
        <p
          aria-live="polite"
          className="text-muted-foreground text-sm"
          id="change-password-success"
          role="status"
        >
          Your password was changed.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="change-password-error"
        >
          {messageForChangePasswordError(state.error)}
        </p>
      ) : null}

      <button
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/25 h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Changing password…" : "Change password"}
      </button>
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
