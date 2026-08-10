import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RailViewportProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function RailViewport({
  children,
  className,
  ...props
}: RailViewportProps) {
  return (
    <div
      className={cn("relative w-full overflow-hidden px-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface RailProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Rail({ children, className, ...props }: RailProps) {
  return (
    <div
      className={cn("border-line mx-auto w-full max-w-5xl border-x", className)}
      {...props}
    >
      {children}
    </div>
  );
}
