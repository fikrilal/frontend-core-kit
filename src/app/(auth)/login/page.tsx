import type { Metadata } from "next";

import { LoginPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginSearchParams = Promise<{
  reset?: string | string[] | undefined;
  verified?: string | string[] | undefined;
}>;

export default async function LoginRoute({
  searchParams,
}: Readonly<{
  searchParams: LoginSearchParams;
}>) {
  const { reset, verified } = await searchParams;

  return (
    <LoginPage
      emailVerificationCompleted={verified === "success"}
      passwordResetCompleted={reset === "success"}
    />
  );
}
