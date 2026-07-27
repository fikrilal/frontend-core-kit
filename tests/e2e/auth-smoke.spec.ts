import { expect, test } from "@playwright/test";

import { addSignedInSessionCookie } from "./helpers/session-cookie";

test.describe("auth smoke (guest)", () => {
  test("marketing topbar shows Sign in", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Dashboard", exact: true }),
    ).toHaveCount(0);
  });

  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    // CardTitle is a div, not a heading role
    await expect(page.getByText("Sign in to Burnly")).toBeVisible();
  });

  test("unauthenticated /reports redirects to /login", async ({ page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders social auth chrome", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Sign in to Burnly")).toBeVisible();
    // Google button (enabled or disabled) and disabled GitHub
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with GitHub/i }),
    ).toBeDisabled();
  });

  test("register page renders without crash", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("Create your account")).toBeVisible();
  });

  test("invalid desktop login params show error without Google button", async ({
    page,
  }) => {
    await page.goto("/login?client=desktop");
    await expect(page.getByText(/Desktop sign-in link invalid/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with Google/i }),
    ).toHaveCount(0);
  });
});

test.describe("auth smoke (signed-in cookie fixture)", () => {
  test.beforeEach(async ({ context }) => {
    await addSignedInSessionCookie(context);
  });

  test("marketing topbar shows Dashboard instead of Sign in", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  });

  test("dashboard is reachable and shows shell", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Account menu" }),
    ).toBeVisible();
  });

  test("sign out clears session for dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/login/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("reports page is reachable and shows shell", async ({ page }) => {
    await page.goto("/reports");

    await expect(page).toHaveURL(/\/reports/);
    await expect(
      page.getByRole("heading", { name: "Reports", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Daily burn")).toBeVisible();
  });

  test("day report page renders for a valid date", async ({ page }) => {
    await page.goto("/reports/2026-07-08");

    await expect(
      page.getByRole("heading", { name: /Jul 8, 2026/ }),
    ).toBeVisible();
  });

  test("tool report page renders for a tool", async ({ page }) => {
    await page.goto("/reports/sources/codex");

    await expect(
      page.getByRole("heading", { name: "codex", exact: true }),
    ).toBeVisible();
  });
});
