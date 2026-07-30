"use client";

import { useActionState } from "react";

import { loginAction } from "./login-action";
import type { LoginActionState, LoginError } from "./login-state";

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="border-border bg-background focus:border-foreground h-10 rounded-lg border px-3 text-sm transition-colors outline-none"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="border-border bg-background focus:border-foreground h-10 rounded-lg border px-3 text-sm transition-colors outline-none"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {messageForLoginError(state.error)}
        </p>
      ) : null}

      <button
        className="bg-foreground text-background hover:bg-foreground/90 h-10 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function messageForLoginError(error: LoginError): string {
  switch (error) {
    case "invalidCredentials":
      return "The email or password is incorrect.";
    case "userSuspended":
      return "This account has been suspended.";
    case "rateLimited":
      return "Too many sign-in attempts. Please wait and try again.";
    case "invalidInput":
      return "Enter a valid email address and password.";
    case "unavailable":
      return "Sign in is temporarily unavailable. Please try again.";
  }
}
