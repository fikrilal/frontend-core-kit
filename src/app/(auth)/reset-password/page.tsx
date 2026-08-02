import type { Metadata } from "next";

import { PasswordResetConfirmationPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: {
    follow: false,
    index: false,
  },
};

type ResetPasswordSearchParams = Promise<{
  token?: string | string[] | undefined;
}>;

export default async function ResetPasswordRoute({
  searchParams,
}: Readonly<{
  searchParams: ResetPasswordSearchParams;
}>) {
  const { token } = await searchParams;
  const resetToken =
    typeof token === "string" && token.length > 0 ? token : null;

  return <PasswordResetConfirmationPage token={resetToken} />;
}
