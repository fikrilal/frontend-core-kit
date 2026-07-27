"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  getIsDarkSnapshot,
  subscribeToThemeClass,
  toggleTheme,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Icon button: moon in dark mode, sun in light. Flips resolved theme and
 * stores an explicit light/dark preference (see `toggleTheme`).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const mounted = useSyncExternalStore(
    () => {
      return () => undefined;
    },
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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={mounted ? (isDark ? "Light theme" : "Dark theme") : "Theme"}
      onClick={onToggle}
      className={cn(
        "text-muted-foreground hover:text-foreground size-8 rounded-lg",
        className,
      )}
    >
      {!mounted ? (
        <span className="size-4" aria-hidden />
      ) : isDark ? (
        <MoonIcon className="size-4" aria-hidden />
      ) : (
        <SunIcon className="size-4" aria-hidden />
      )}
    </Button>
  );
}
