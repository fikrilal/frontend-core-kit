import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";

import { loadAuthenticatedUser } from "../../auth/session/load-authenticated-user";
import { UpdateProfileForm } from "./update-profile-form";

export async function ProfilePage() {
  const result = await loadAuthenticatedUser();

  return (
    <main className="bg-muted/35 flex min-h-svh items-center justify-center px-4 py-12">
      <section
        aria-labelledby="profile-heading"
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
            id="profile-heading"
          >
            Your profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Update how you appear in Lamara.
          </p>
        </div>

        {result.ok ? (
          <UpdateProfileForm
            displayName={result.user.profile.displayName}
            givenName={result.user.profile.givenName}
            familyName={result.user.profile.familyName}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            Your profile is temporarily unavailable. Try again in a moment.
          </p>
        )}
      </section>
    </main>
  );
}
