import { AuthShell } from "@/components/layout/auth-shell";
import { loadAuthenticatedUser } from "@/features/auth";

import { CancelAccountDeletionForm } from "./cancel-account-deletion-form";
import { RequestAccountDeletionForm } from "./request-account-deletion-form";

export async function RequestAccountDeletionPage() {
  const result = await loadAuthenticatedUser();

  return (
    <AuthShell
      description="Your account is scheduled for deletion after a 30-day grace period. You can cancel at any time before then."
      headingId="request-account-deletion-heading"
      title="Delete your account"
    >
      {result.ok && result.user.accountDeletion ? (
        <>
          <p className="text-muted-foreground text-sm">
            A deletion request is already in progress.
          </p>
          <CancelAccountDeletionForm />
        </>
      ) : (
        <RequestAccountDeletionForm />
      )}
    </AuthShell>
  );
}
