import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Analytics section chrome: uppercase label + optional trailing meta.
 * Prefer this over Card on dashboard/reports.
 */
export function AppSection({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {title}
        </h2>
        {meta != null ? (
          <div className="text-muted-foreground shrink-0 text-sm tabular-nums">
            {meta}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
