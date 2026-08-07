import type { Metadata } from "next";

import { RequestAccountDeletionPage } from "@/features/users";

export const metadata: Metadata = {
  title: "Delete account",
};

export default function RequestAccountDeletionRoute() {
  return <RequestAccountDeletionPage />;
}
