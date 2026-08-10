import Link from "next/link";

import { FrontendCoreMark } from "@/components/brand/frontend-core-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function SiteTopbar() {
  return (
    <header className="bg-background sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-4 px-6">
        <Link
          aria-label="Frontend Core Kit home"
          className="text-foreground flex items-center gap-2 font-medium transition-opacity hover:opacity-75"
          href="/"
        >
          <FrontendCoreMark className="size-7" />
          <span className="text-sm tracking-tight">Frontend Core Kit</span>
        </Link>

        <div className="flex-1" />

        <Link
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          href="/login"
        >
          Sign in
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
