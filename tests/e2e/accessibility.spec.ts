import AxePlaywrightBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

test("landing page has no detectable WCAG A/AA violations and supports keyboard navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expectNoAccessibilityViolations(page);

  const signIn = page
    .getByRole("link", { name: "Sign in", exact: true })
    .first();
  await signIn.focus();
  await expect(signIn).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/login$/);
});

test("login form exposes labels, focus order, errors, and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/login");
  await expectNoAccessibilityViolations(page);

  await page.getByRole("link", { name: "Lamara home" }).focus();
  await page.keyboard.press("Tab");
  const email = page.getByLabel("Email");
  await expect(email).toBeFocused();
  await expectKeyboardFocusIndicator(email);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password")).toBeFocused();

  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  const error = page.locator("#login-error");
  await expect(error).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute(
    "aria-describedby",
    "login-error",
  );
  await expectNoAccessibilityViolations(page);
});

test("protected route redirects to an accessible login page", async ({
  page,
}) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page).toHaveTitle("Sign in | Lamara");
  await expectNoAccessibilityViolations(page);
});

test("authenticated foundation has landmarks and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await signIn(page);
  await expect(page).toHaveTitle("App | Lamara");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expectNoAccessibilityViolations(page);
});

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxePlaywrightBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function expectKeyboardFocusIndicator(locator: Locator) {
  await expect(locator).toBeFocused();
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const styles = window.getComputedStyle(element);
        return styles.outlineStyle !== "none" || styles.boxShadow !== "none";
      }),
    )
    .toBe(true);
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}
