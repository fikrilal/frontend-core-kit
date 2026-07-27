import type { ReactNode } from "react";

interface MarketingShellProps {
  children: ReactNode;
}

export function MarketingShell({ children }: MarketingShellProps) {
  return <main className="w-full flex-1 overflow-x-clip">{children}</main>;
}
