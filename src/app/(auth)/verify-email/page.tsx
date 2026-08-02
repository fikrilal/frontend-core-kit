import type { Metadata } from "next";

import { EmailVerificationPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: {
    follow: false,
    index: false,
  },
};

type EmailVerificationSearchParams = Promise<{
  token?: string | string[] | undefined;
}>;

export default async function VerifyEmailRoute({
  searchParams,
}: Readonly<{
  searchParams: EmailVerificationSearchParams;
}>) {
  const { token } = await searchParams;
  const verificationToken =
    typeof token === "string" && token.length > 0 ? token : null;

  return <EmailVerificationPage token={verificationToken} />;
}
