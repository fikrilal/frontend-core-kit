import { AuthShell } from "@/components/layout/auth-shell";

import { loadAuthenticatedUser } from "../session/load-authenticated-user";
import { ChangePasswordForm } from "./change-password-form";

export async function ChangePasswordPage() {
  await loadAuthenticatedUser();

  return (
    <AuthShell
      description="Choose a new password for your account."
      headingId="change-password-heading"
      title="Change your password"
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
