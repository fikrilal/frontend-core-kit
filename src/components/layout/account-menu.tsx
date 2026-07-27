"use client";

import Link from "next/link";
import { useTransition } from "react";

import { FreshnessDot } from "@/components/layout/freshness-dot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsFor } from "@/lib/format/initials";
import { syncFreshness } from "@/lib/format/sync-freshness";
import { formatLastSyncAt } from "@/lib/format/tokens";
import { cn } from "@/lib/utils";

export { FreshnessDot } from "@/components/layout/freshness-dot";

export interface AccountMobileNavItem {
  href: string;
  label: string;
  current?: boolean;
}

/**
 * Account dropdown for the app shell header — identity, sync freshness,
 * profile, settings, devices, and sign-out.
 */
export function AccountMenu({
  userLabel,
  lastSyncAt,
  signOutAction,
  mobileNavItems = [],
}: {
  userLabel?: string;
  lastSyncAt: string | null;
  signOutAction: () => Promise<void>;
  mobileNavItems?: readonly AccountMobileNavItem[];
}) {
  const [pending, startTransition] = useTransition();
  const freshness = syncFreshness(lastSyncAt);
  const relative = formatLastSyncAt(lastSyncAt);
  const syncLabel =
    freshness === "never" || relative === null
      ? "Never synced"
      : freshness === "stale"
        ? `Last sync ${relative}`
        : `Synced ${relative}`;

  return (
    // Non-modal: a modal menu locks body scroll (overflow:hidden), which
    // removes the page scrollbar and shifts the layout on open.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
          "hover:bg-muted/60 data-[state=open]:bg-muted data-[state=open]:text-foreground",
        )}
      >
        <span aria-hidden>{initialsFor(userLabel)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="border-line ring-foreground/10 dark:ring-border w-56 shadow-xs ring-1"
      >
        <DropdownMenuLabel className="space-y-1">
          <p
            className="text-foreground truncate text-sm font-medium"
            title={userLabel}
          >
            {userLabel ?? "Signed in"}
          </p>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal">
            <FreshnessDot freshness={freshness} />
            {syncLabel}
          </p>
        </DropdownMenuLabel>

        {/* Mobile-only primary nav */}
        {mobileNavItems.length > 0 ? (
          <div className="sm:hidden">
            <DropdownMenuSeparator className="bg-line" />
            {mobileNavItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  aria-current={item.current ? "page" : undefined}
                  className={cn(
                    "cursor-pointer",
                    item.current && "text-foreground font-medium",
                  )}
                >
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ) : null}

        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/devices" className="cursor-pointer">
            Devices
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pending}
          onSelect={() => {
            startTransition(() => {
              void signOutAction();
            });
          }}
        >
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
