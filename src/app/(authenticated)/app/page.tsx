import type { Metadata } from "next";

import { AuthenticatedPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "App",
};

export default function AuthenticatedRoute() {
  return <AuthenticatedPage />;
}
