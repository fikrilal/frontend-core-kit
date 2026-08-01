"use client";

import { useActionState } from "react";

import { registerAction } from "./register-action";
import type { RegisterActionState, RegisterError } from "./register-state";

const initialState: RegisterActionState = { error: null };

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="register-email">
          Email
        </label>
        <input
          aria-describedby={state.error ? "register-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="email"
          className="border-border bg-background focus:border-foreground focus-visible:ring-foreground/25 h-10 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          id="register-email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="register-password">
          Password
        </label>
        <input
          aria-describedby={state.error ? "register-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="new-password"
          className="border-border bg-background focus:border-foreground focus-visible:ring-foreground/25 h-10 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          id="register-password"
          minLength={10}
          name="password"
          required
          type="password"
        />
      </div>

      <div className="grid gap-2">
        <label
          className="text-sm font-medium"
          htmlFor="register-password-confirmation"
        >
          Confirm password
        </label>
        <input
          aria-describedby={state.error ? "register-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="new-password"
          className="border-border bg-background focus:border-foreground focus-visible:ring-foreground/25 h-10 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          id="register-password-confirmation"
          minLength={10}
          name="passwordConfirmation"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="register-error"
        >
          {messageForRegisterError(state.error)}
        </p>
      ) : null}

      <button
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/25 h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function messageForRegisterError(error: RegisterError): string {
  switch (error) {
    case "emailAlreadyExists":
      return "An account with this email already exists. Try signing in.";
    case "invalidInput":
      return "Enter a valid email and a matching password of at least 10 characters.";
    case "unavailable":
      return "Account creation is temporarily unavailable. Please try again.";
  }
}
