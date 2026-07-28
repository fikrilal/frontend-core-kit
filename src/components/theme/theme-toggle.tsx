"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getIsDarkSnapshot,
  subscribeToThemeClass,
  toggleTheme,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const isDark = useSyncExternalStore(
    subscribeToThemeClass,
    getIsDarkSnapshot,
    () => false,
  );

  const onToggle = useCallback(() => {
    toggleTheme();
  }, []);

  const label = !mounted
    ? "Toggle theme"
    : isDark
      ? "Switch to light theme"
      : "Switch to dark theme";

  return (
    <button
      type="button"
      aria-label={label}
      title={mounted ? (isDark ? "Light theme" : "Dark theme") : "Theme"}
      onClick={onToggle}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-foreground/25 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      {mounted ? (
        isDark ? (
          <MoonIcon />
        ) : (
          <SunIcon />
        )
      ) : (
        <span className="size-4" aria-hidden />
      )}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="12" cy="12" r="3.5" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
      />
    </svg>
  );
}
