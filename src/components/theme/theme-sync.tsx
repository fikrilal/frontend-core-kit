"use client";

import { useEffect } from "react";

import {
  THEME_STORAGE_KEY,
  applyThemePreference,
  getStoredThemePreference,
} from "@/lib/theme";

/**
 * Keep resolved theme in sync:
 * - when preference is `system`, follow OS `prefers-color-scheme` changes
 * - when preference is explicit light/dark, re-apply on mount (storage wins)
 */
export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyFromPreference = () => {
      applyThemePreference(getStoredThemePreference());
    };

    applyFromPreference();

    const onMediaChange = () => {
      if (getStoredThemePreference() === "system") {
        applyFromPreference();
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        applyFromPreference();
      }
    };

    media.addEventListener("change", onMediaChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onMediaChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
