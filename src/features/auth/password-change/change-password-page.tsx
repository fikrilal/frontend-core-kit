import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";

import { loadAuthenticatedUser } from "../session/load-authenticated-user";
import { ChangePasswordForm } from "./change-password-form";

export async function ChangePasswordPage() {
  await loadAuthenticatedUser();

  return (
    <main className="bg-muted/35 flex min-h-svh items-center justify-center px-4 py-12">
      <section
        aria-labelledby="change-password-heading"
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
            id="change-password-heading"
          >
            Change your password
          </h1>
          <p className="text-muted-foreground text-sm">
            Choose a new password for your account.
          </p>
        </div>

        <ChangePasswordForm />
      </section>
    </main>
  );
}
