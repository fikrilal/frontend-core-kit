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

test("registration form exposes labels, password guidance, and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/register");
  await expectNoAccessibilityViolations(page);
  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "minlength",
    "10",
  );
  await expect(page.getByLabel("Confirm password")).toHaveAttribute(
    "autocomplete",
    "new-password",
  );

  await page.getByRole("link", { name: "Lamara home" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await expectKeyboardFocusIndicator(page.getByLabel("Email"));

  await page.getByLabel("Email").fill("existing@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password-10");
  await page.getByLabel("Confirm password").fill("test-password-10");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("#register-error")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute(
    "aria-describedby",
    "register-error",
  );
  await expectNoAccessibilityViolations(page);
});

test("password reset form exposes safe feedback and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await expectNoAccessibilityViolations(page);
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Lamara home" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await expectKeyboardFocusIndicator(page.getByLabel("Email"));

  await page.getByLabel("Email").fill("rate-limited@example.com");
  await page.getByRole("button", { name: "Send reset instructions" }).click();
  const error = page.locator("#password-reset-error");
  await expect(error).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute(
    "aria-describedby",
    "password-reset-error",
  );
  await expectNoAccessibilityViolations(page);
});

test("password reset confirmation exposes password guidance and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/reset-password?token=valid-reset-token");
  await expectNoAccessibilityViolations(page);
  await expect(
    page.getByRole("heading", { name: "Choose a new password" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("New password", { exact: true }),
  ).toHaveAttribute("minlength", "10");
  await expect(page.getByLabel("Confirm new password")).toHaveAttribute(
    "autocomplete",
    "new-password",
  );

  await page.getByRole("link", { name: "Lamara home" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("New password", { exact: true })).toBeFocused();
  await expectKeyboardFocusIndicator(
    page.getByLabel("New password", { exact: true }),
  );
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Confirm new password")).toBeFocused();

  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("different-password");
  await page.getByRole("button", { name: "Update password" }).click();
  const error = page.locator("#password-reset-confirmation-error");
  await expect(error).toBeVisible();
  await expect(
    page.getByLabel("New password", { exact: true }),
  ).toHaveAttribute(
    "aria-describedby",
    "password-reset-confirmation-password-hint password-reset-confirmation-error",
  );
  await expect(page.getByLabel("Confirm new password")).toHaveAttribute(
    "aria-describedby",
    "password-reset-confirmation-error",
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
