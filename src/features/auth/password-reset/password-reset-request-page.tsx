import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";

import { PasswordResetRequestForm } from "./password-reset-request-form";

export function PasswordResetRequestPage() {
  return (
    <main className="bg-muted/35 flex min-h-svh items-center justify-center px-4 py-12">
      <section
        aria-labelledby="password-reset-heading"
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
            id="password-reset-heading"
          >
            Reset your password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we&apos;ll send instructions if an account
            exists.
          </p>
        </div>

        <PasswordResetRequestForm />

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Remember your password?{" "}
          <Link className="text-foreground font-medium underline" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
