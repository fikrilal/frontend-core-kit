"use client";

import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

import { cn } from "@/lib/utils";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: cn(
            "group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-line group-[.toaster]:shadow-lg",
            "group-[.toaster]:font-sans group-[.toaster]:text-sm",
          ),
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
