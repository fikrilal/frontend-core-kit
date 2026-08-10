"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { passwordRegisterRequestDtoPasswordMin } from "@/contracts/example-api/runtime";

import { registerAction } from "./register-action";
import type { RegisterActionState, RegisterError } from "./register-state";

const initialState: RegisterActionState = { error: null };

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          aria-describedby={state.error ? "register-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="email"
          id="register-email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          aria-describedby={state.error ? "register-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="new-password"
          id="register-password"
          minLength={passwordRegisterRequestDtoPasswordMin}
          name="password"
          required
          type="password"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="register-password-confirmation">Confirm password</Label>
        <Input
          aria-describedby={state.error ? "register-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          autoComplete="new-password"
          id="register-password-confirmation"
          minLength={passwordRegisterRequestDtoPasswordMin}
          name="passwordConfirmation"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <Alert aria-live="polite" id="register-error" variant="destructive">
          <AlertDescription className="text-destructive!">
            {messageForRegisterError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Creating account…" : "Create account"}
      </Button>
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
