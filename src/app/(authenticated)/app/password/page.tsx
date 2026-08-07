import type { Metadata } from "next";

import { ChangePasswordPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Change password",
};

export default function ChangePasswordRoute() {
  return <ChangePasswordPage />;
}
