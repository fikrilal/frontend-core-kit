import type { Metadata } from "next";

import { PasswordResetRequestPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordRoute() {
  return <PasswordResetRequestPage />;
}
