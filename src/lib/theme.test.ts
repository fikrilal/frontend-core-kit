import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  THEME_STORAGE_KEY,
  applyThemePreference,
  getStoredThemePreference,
  resolveTheme,
  toggleTheme,
} from "./theme";

describe("theme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("defaults preference to light when storage empty", () => {
    expect(getStoredThemePreference()).toBe("light");
  });

  it("resolves system preference from matchMedia", () => {
    expect(resolveTheme("system")).toBe("dark");
  });

  it("resolves empty storage as light without needing matchMedia", () => {
    expect(resolveTheme()).toBe("light");
  });

  it("applies explicit light preference and persists it", () => {
    applyThemePreference("light");

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(getStoredThemePreference()).toBe("light");
  });

  it("applies explicit dark preference and persists it", () => {
    applyThemePreference("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("toggle flips resolved theme to an explicit preference", () => {
    expect(resolveTheme()).toBe("light");

    const next = toggleTheme();
    expect(next).toBe("dark");
    expect(getStoredThemePreference()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    expect(toggleTheme()).toBe("light");
    expect(getStoredThemePreference()).toBe("light");
  });
});
