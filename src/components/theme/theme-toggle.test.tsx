import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyThemePreference } from "@/lib/theme";

import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
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
    applyThemePreference("dark");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("toggles from dark to light on click", async () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", {
      name: "Switch to light theme",
    });
    fireEvent.click(button);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Switch to dark theme" }),
      ).toBeInTheDocument();
    });
  });
});
