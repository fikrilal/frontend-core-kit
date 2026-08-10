"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction } from "./login-action";
import type { LoginActionState, LoginError } from "./login-state";

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          aria-describedby={state.error ? "login-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="email"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          aria-describedby={state.error ? "login-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <Alert aria-live="polite" id="login-error" variant="destructive">
          <AlertDescription className="!text-destructive">
            {messageForLoginError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
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
