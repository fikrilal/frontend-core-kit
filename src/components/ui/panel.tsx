import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Lined panel chrome from code-alchemy (screen hairlines + vertical borders).
 * Call sites may still pass padding via className (e.g. `p-6`).
 */
function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="panel"
      className={cn(
        "screen-line-top screen-line-bottom border-line border-x",
        className,
      )}
      {...props}
    />
  );
}

function PanelHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      data-slot="panel-header"
      className={cn("screen-line-bottom px-4", className)}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-title"
      className={cn(
        "text-foreground text-3xl font-medium tracking-tight text-balance",
        className,
      )}
      {...props}
    />
  );
}

function PanelContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="panel-body" className={cn("p-4", className)} {...props} />
  );
}

export { Panel, PanelContent, PanelHeader, PanelTitle };
