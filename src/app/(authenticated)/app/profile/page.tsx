import type { Metadata } from "next";

import { ProfilePage } from "@/features/users";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfileRoute() {
  return <ProfilePage />;
}
