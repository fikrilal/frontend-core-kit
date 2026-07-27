import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";
import { Rail, RailViewport } from "@/components/layout/rail";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";

import { AccountMenu } from "./account-menu";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reports", label: "Reports" },
] as const;

function isActivePath(href: string, activePath: string): boolean {
  return activePath === href || activePath.startsWith(`${href}/`);
}

/**
 * App shell header — lined chrome from code-alchemy / _tmp (screen lines +
 * border-x rail). Brand left, primary nav, account control right.
 */
export function AppHeader({
  activePath,
  userLabel,
  lastSyncAt,
  signOutAction,
}: {
  /** Path of the current page, used for the nav active state. */
  activePath: string;
  userLabel?: string;
  lastSyncAt: string | null;
  signOutAction: () => Promise<void>;
}) {
  return (
    <header className="bg-background sticky top-0 z-50 w-full overflow-x-clip">
      <RailViewport>
        <Rail className="screen-line-top screen-line-bottom relative flex h-14 max-w-5xl items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="text-foreground flex shrink-0 items-center gap-2 px-2 font-medium sm:px-3"
            aria-label="Lamara home"
          >
            <LamaraMark className="size-6" />
            <span className="text-sm tracking-tight">Lamara</span>
          </Link>

          <div className="flex-1" />

          <nav
            aria-label="Primary"
            className="hidden items-center gap-4 sm:flex"
          >
            {navigationItems.map((item) => {
              const current = isActivePath(item.href, activePath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground text-sm font-medium tracking-wide transition-colors"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 pr-2 sm:pr-3">
            <ThemeToggle />
            <Separator
              orientation="vertical"
              className="bg-line mx-1 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-center sm:block"
            />
            <AccountMenu
              userLabel={userLabel}
              lastSyncAt={lastSyncAt}
              signOutAction={signOutAction}
              /** Mobile: compact nav lives in the menu until a drawer exists. */
              mobileNavItems={navigationItems.map((item) => ({
                ...item,
                current: isActivePath(item.href, activePath),
              }))}
            />
          </div>
        </Rail>
      </RailViewport>
    </header>
  );
}
