import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";
import { Rail } from "@/components/layout/rail";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const githubUrl = "https://github.com/fikrilal/lamara";

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

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-5 sm:flex"
        >
          <a
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            href="#how-it-works"
          >
            How it works
          </a>
          <a
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            href="#privacy"
          >
            Privacy
          </a>
        </nav>

        <div className="bg-line hidden h-5 w-px sm:block" aria-hidden />

        <a
          aria-label="Lamara source code on GitHub"
          className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-foreground/25 inline-flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
          href={githubUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <GitHubIcon />
        </a>
        <ThemeToggle />
      </Rail>
    </header>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.18c-3.14.68-3.8-1.34-3.8-1.34-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.7 10.7 0 0 1 5.64 0c2.15-1.46 3.1-1.15 3.1-1.15.62 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.64 5.27-5.15 5.55.4.35.76 1.04.76 2.09v3.13c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
    </svg>
  );
}
