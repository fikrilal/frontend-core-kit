import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";

import { EmailVerificationForm } from "./email-verification-form";

export function EmailVerificationPage({
  token,
}: Readonly<{
  token: string | null;
}>) {
  return (
    <main className="bg-muted/35 flex min-h-svh items-center justify-center px-4 py-12">
      <section
        aria-labelledby="email-verification-heading"
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
            id="email-verification-heading"
          >
            Verify your email
          </h1>
          <p className="text-muted-foreground text-sm">
            Confirm your email address to finish setting up your account.
          </p>
        </div>

        <EmailVerificationForm token={token} />
      </section>
    </main>
  );
}
