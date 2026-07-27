import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";
import { Rail } from "@/components/layout/rail";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { VerticalSeparator } from "@/components/ui/separator";
import { initialsFor } from "@/lib/format/initials";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/download", label: "Download" },
] as const;

const githubUrl = "https://github.com/fikrilal/lamara";

const navLinkClass =
  "text-muted-foreground hover:text-foreground text-sm font-medium transition";

const actionLinkClass =
  "text-muted-foreground hover:text-foreground focus-visible:ring-accent inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

export interface SiteTopbarProps {
  /** When true, show avatar linking directly to Dashboard instead of Sign in. */
  signedIn?: boolean;
  /** Optional email/name when signed in. */
  userLabel?: string;
  /** Optional last sync timestamp. */
  lastSyncAt?: string | null;
  /** Optional custom sign out action. */
  signOutAction?: () => Promise<void>;
}

/**
 * Marketing site header. Auth state is resolved by the parent layout.
 * When signed in, clicking the avatar navigates directly to /dashboard.
 */
export function SiteTopbar({
  signedIn = false,
  userLabel,
}: SiteTopbarProps = {}) {
  return (
    <header className="bg-background sticky top-0 z-50 w-full overflow-x-clip px-2">
      <Rail className="screen-line-top screen-line-bottom flex h-14 items-center gap-2 px-2 sm:gap-4">
        <Link
          aria-label="Lamara home"
          className="group text-foreground -ml-0.5 flex h-10 items-center gap-2 transition active:scale-[0.98]"
          href="/"
        >
          <LamaraMark className="group-hover:text-accent transition" />
          <span className="sr-only">Lamara</span>
        </Link>

        <div className="flex-1" />

        <nav aria-label="Primary" className="hidden items-center gap-5 sm:flex">
          {navigationItems.map((item) => (
            <Link className={navLinkClass} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <VerticalSeparator className="hidden sm:block" />

        <Link
          aria-label="Lamara on GitHub"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
          href={githubUrl}
          rel="noopener noreferrer"
          target="_blank"
          title="Lamara on GitHub"
        >
          <GitHubIcon className="size-4" />
        </Link>

        <ThemeToggle />

        <VerticalSeparator className="hidden sm:block" />

        {signedIn ? (
          <Link
            href="/dashboard"
            aria-label="Dashboard"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            title={userLabel ? `Dashboard (${userLabel})` : "Dashboard"}
          >
            <span aria-hidden>{initialsFor(userLabel)}</span>
          </Link>
        ) : (
          <Link
            className={cn(actionLinkClass, "text-foreground")}
            href="/login"
          >
            Sign in
          </Link>
        )}
      </Rail>
    </header>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.29 1.23A11.5 11.5 0 0 1 12 5.4c1.02 0 2.05.14 3.01.41 2.28-1.55 3.28-1.23 3.28-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.69.83.57A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}
