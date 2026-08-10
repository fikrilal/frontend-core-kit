import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/layout/auth-shell";

import { LoginForm } from "./login-form";

export function LoginPage({
  emailVerificationCompleted = false,
  passwordResetCompleted = false,
}: Readonly<{
  emailVerificationCompleted?: boolean;
  passwordResetCompleted?: boolean;
}> = {}) {
  return (
    <AuthShell
      description="Use your Lamara account to continue."
      headingId="login-heading"
      title="Sign in"
    >
      {passwordResetCompleted ? (
        <Alert
          aria-live="polite"

          id="password-reset-complete"
          role="status"
        >
          <AlertDescription>
            Your password has been reset. Sign in with your new password.
          </AlertDescription>
        </Alert>
      ) : emailVerificationCompleted ? (
        <Alert
          aria-live="polite"

          id="email-verification-complete"
          role="status"
        >
          <AlertDescription>
            Your email has been verified. Sign in to continue.
          </AlertDescription>
        </Alert>
      ) : null}

      <LoginForm />

      <p className="text-muted-foreground mt-5 text-center text-sm">
        <Link
          className="text-foreground font-medium underline"
          href="/forgot-password"
        >
          Forgot your password?
        </Link>
      </p>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Need an account?{" "}
        <Link
          className="text-foreground font-medium underline"
          href="/register"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
