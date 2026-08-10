import Link from "next/link";
import type { ReactNode } from "react";

import { FrontendCoreMark } from "@/components/brand/frontend-core-mark";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

type AuthShellProps = Readonly<{
  children: ReactNode;
  description: string;
  headingId: string;
  title: string;
  width?: "sm" | "xl";
}>;

export function AuthShell({
  children,
  description,
  headingId,
  title,
  width = "sm",
}: AuthShellProps) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className={width === "xl" ? "w-full max-w-xl" : "w-full max-w-sm"}>
        <CardHeader>
          <Link
            aria-label="Frontend Core Kit home"
            className="inline-flex items-center gap-2 font-medium"
            href="/"
          >
            <FrontendCoreMark className="size-7" />
            <span className="text-sm">Frontend Core Kit</span>
          </Link>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="space-y-2">
            <h1
              className="text-2xl leading-none font-semibold tracking-tight"
              id={headingId}
            >
              {title}
            </h1>
            <CardDescription>{description}</CardDescription>
          </div>
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
