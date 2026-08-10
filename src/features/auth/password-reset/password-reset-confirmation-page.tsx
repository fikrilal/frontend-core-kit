import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";

import { PasswordResetConfirmationForm } from "./password-reset-confirmation-form";

export function PasswordResetConfirmationPage({
  token,
}: Readonly<{
  token: string | null;
}>) {
  return (
    <AuthShell
      description="Enter a new password for your account."
      headingId="password-reset-confirmation-heading"
      title="Choose a new password"
    >
      <PasswordResetConfirmationForm token={token} />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remember your password?{" "}
        <Link className="text-foreground font-medium underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
