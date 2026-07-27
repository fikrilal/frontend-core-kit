"use client";

import { Separator as SeparatorPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Compact vertical rule for nav/toolbars.
 * Kept as a plain span: fixed h-5, not stretch-to-parent.
 */
function VerticalSeparator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("bg-border h-5 w-px shrink-0", className)}
    />
  );
}

export { Separator, VerticalSeparator };
