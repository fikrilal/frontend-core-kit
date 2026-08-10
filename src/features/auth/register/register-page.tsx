import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";

import { RegisterForm } from "./register-form";

export function RegisterPage() {
  return (
    <AuthShell
      description="Use your email to create a Lamara account."
      headingId="register-heading"
      title="Create your account"
    >
      <RegisterForm />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
