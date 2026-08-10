import { AuthShell } from "@/components/layout/auth-shell";

import { EmailVerificationForm } from "./email-verification-form";

export function EmailVerificationPage({
  token,
}: Readonly<{
  token: string | null;
}>) {
  return (
    <AuthShell
      description="Confirm your email address to finish setting up your account."
      headingId="email-verification-heading"
      title="Verify your email"
    >
      <EmailVerificationForm token={token} />
    </AuthShell>
  );
}
