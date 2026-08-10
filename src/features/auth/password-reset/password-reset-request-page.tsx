import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";

import { PasswordResetRequestForm } from "./password-reset-request-form";

export function PasswordResetRequestPage() {
  return (
    <AuthShell
      description="Enter your email and we'll send instructions if an account exists."
      headingId="password-reset-heading"
      title="Reset your password"
    >
      <PasswordResetRequestForm />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remember your password?{" "}
        <Link className="text-foreground font-medium underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
