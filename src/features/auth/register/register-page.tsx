import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";

import { RegisterForm } from "./register-form";

export function RegisterPage() {
  return (
    <main className="bg-muted/35 flex min-h-svh items-center justify-center px-4 py-12">
      <section
        aria-labelledby="register-heading"
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
            id="register-heading"
          >
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm">
            Use your email to create a Lamara account.
          </p>
        </div>

        <RegisterForm />

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link className="text-foreground font-medium underline" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
