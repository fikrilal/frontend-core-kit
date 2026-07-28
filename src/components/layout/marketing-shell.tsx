import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteTopbar } from "@/components/layout/site-topbar";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <SiteTopbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
