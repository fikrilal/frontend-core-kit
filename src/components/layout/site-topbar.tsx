import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";
import { Rail } from "@/components/layout/rail";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function SiteTopbar() {
  return (
    <header className="bg-background/92 sticky top-0 z-50 w-full overflow-x-clip px-2 backdrop-blur-md">
      <Rail className="screen-line-bottom flex h-14 items-center gap-4 px-3">
        <Link
          aria-label="Lamara home"
          className="text-foreground flex items-center gap-2 font-medium transition-opacity hover:opacity-75"
          href="/"
        >
          <LamaraMark className="size-7" />
          <span className="text-sm tracking-tight">Lamara</span>
        </Link>

        <div className="flex-1" />

        <Link
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          href="/login"
        >
          Sign in
        </Link>
        <ThemeToggle />
      </Rail>
    </header>
  );
}
