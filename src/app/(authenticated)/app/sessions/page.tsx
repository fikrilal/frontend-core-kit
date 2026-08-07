import type { Metadata } from "next";

import { SessionsPage } from "@/features/users";

export const metadata: Metadata = {
  title: "Sessions",
};

export default function SessionsRoute() {
  return <SessionsPage />;
}
