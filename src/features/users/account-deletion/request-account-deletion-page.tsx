import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";

import { loadAuthenticatedUser } from "../../auth/session/load-authenticated-user";
import { CancelAccountDeletionForm } from "./cancel-account-deletion-form";
import { RequestAccountDeletionForm } from "./request-account-deletion-form";

export async function RequestAccountDeletionPage() {
  const result = await loadAuthenticatedUser();

  return (
    <main className="bg-muted/35 flex min-h-svh items-center justify-center px-4 py-12">
      <section
        aria-labelledby="request-account-deletion-heading"
        className="border-border bg-background w-full max-w-sm rounded-2xl border p-7 shadow-sm"
      >
        <Link
          aria-label="Lamara home"
          className="mb-8 inline-flex items-center gap-2 font-medium"
          href="/"
        >
          <LamaraMark className="size-7" />
          <span className="text-sm">Lamara</span>
        </Link>

        <div className="mb-7 space-y-2">
          <h1
            className="text-2xl font-semibold tracking-tight"
            id="request-account-deletion-heading"
          >
            Delete your account
          </h1>
          <p className="text-muted-foreground text-sm">
            Your account is scheduled for deletion after a 30-day grace period.
            You can cancel at any time before then.
          </p>
        </div>

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
      </section>
    </main>
  );
}
