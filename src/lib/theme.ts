/** localStorage key for the user theme preference. */
export const THEME_STORAGE_KEY = "theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** When unset, use light mode (user can still pick dark or system). */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "light";

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_PREFERENCE;
  }

  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    // private browsing / blocked storage
  }

  return DEFAULT_THEME_PREFERENCE;
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(
  preference: ThemePreference = getStoredThemePreference(),
): ResolvedTheme {
  if (preference === "system") {
    return getSystemTheme();
  }
  return preference;
}

export function applyThemePreference(preference: ThemePreference): void {
  if (typeof document === "undefined") {
    return;
  }

  const resolved = resolveTheme(preference);
  const isDark = resolved === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = resolved;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore storage failures (private browsing, blocked storage).
  }
}

/**
 * Flip between light and dark based on the *resolved* theme.
 * Always stores an explicit preference (leaves "system" behind).
 */
export function toggleTheme(): ResolvedTheme {
  const next: ResolvedTheme = resolveTheme() === "dark" ? "light" : "dark";
  applyThemePreference(next);
  return next;
}

/** Subscribe to `.dark` class changes on <html> for React state. */
export function subscribeToThemeClass(onStoreChange: () => void): () => void {
  if (typeof document === "undefined") {
    return () => undefined;
  }

  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function getIsDarkSnapshot(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.documentElement.classList.contains("dark");
}
