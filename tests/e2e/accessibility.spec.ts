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

test("email verification exposes a labelled action and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/verify-email?token=valid-verification-token");
  await expectNoAccessibilityViolations(page);
  await expect(
    page.getByRole("heading", { name: "Verify your email" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Verify email" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Lamara home" }).focus();
  await page.keyboard.press("Tab");
  const verifyButton = page.getByRole("button", { name: "Verify email" });
  await expect(verifyButton).toBeFocused();
  await expectKeyboardFocusIndicator(verifyButton);

  await page.goto("/verify-email?token=invalid-verification-token");
  await page.getByRole("button", { name: "Verify email" }).click();
  const error = page.locator("#email-verification-error");
  await expect(error).toBeVisible();
  await expect(verifyButton).toHaveAttribute(
    "aria-describedby",
    "email-verification-error",
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

test("unverified authenticated foundation exposes a resend action and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill("new-user@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password-10");
  await page.getByLabel("Confirm password").fill("test-password-10");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expectNoAccessibilityViolations(page);

  const resend = page.getByRole("button", {
    name: "Resend verification email",
  });
  await page.getByRole("button", { name: "Sign out" }).focus();
  await page.keyboard.press("Tab");
  await expect(resend).toBeFocused();
  await expectKeyboardFocusIndicator(resend);
  await resend.click();
  await expect(
    page.getByRole("status").filter({
      hasText: "A new verification email is on its way.",
    }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("profile editor exposes labelled fields, focus order, and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/app/profile");
  await expect(page).toHaveTitle("Profile | Lamara");
  await expectNoAccessibilityViolations(page);

  const displayName = page.getByLabel("Display name");
  await expect(displayName).toHaveValue("Example User");
  await displayName.focus();
  await expectKeyboardFocusIndicator(displayName);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Given name")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Family name")).toBeFocused();

  await displayName.fill("conflict-display-name");
  await page.getByRole("button", { name: "Save profile" }).click();
  const error = page.locator("#update-profile-error");
  await expect(error).toBeVisible();
  await expect(displayName).toHaveAttribute(
    "aria-describedby",
    "update-profile-error",
  );
  await expectNoAccessibilityViolations(page);
});

test("sessions list has landmarks, labelled statuses, and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/app/sessions");
  await expect(page).toHaveTitle("Sessions | Lamara");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByText("active")).toHaveCount(1);
  await expect(page.getByText("revoked")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Revoke" })).toHaveCount(2);
  await expectNoAccessibilityViolations(page);
});

test("change-password form exposes labels, password guidance, and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/app/password");
  await expect(page).toHaveTitle("Change password | Lamara");
  await expectNoAccessibilityViolations(page);

  await expect(
    page.getByLabel("New password", { exact: true }),
  ).toHaveAttribute("minlength", "10");
  await expect(page.getByLabel("Confirm new password")).toHaveAttribute(
    "autocomplete",
    "new-password",
  );

  await page.getByLabel("Current password").focus();
  await expectKeyboardFocusIndicator(page.getByLabel("Current password"));
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("New password", { exact: true })).toBeFocused();

  await page.getByLabel("Current password").fill("wrong-password");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("new-password-10");
  await page.getByRole("button", { name: "Change password" }).click();
  const error = page.locator("#change-password-error");
  await expect(error).toBeVisible();
  await expect(page.getByLabel("Current password")).toHaveAttribute(
    "aria-describedby",
    "change-password-error",
  );
  await expectNoAccessibilityViolations(page);
});

test("account-deletion request surface has landmarks and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/app/account-deletion");
  await expect(page).toHaveTitle("Delete account | Lamara");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Request account deletion" }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("account-deletion pending state exposes a cancel action and no detectable WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("pending@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/account-deletion");
  await expect(
    page.getByRole("button", { name: "Cancel account deletion" }),
  ).toBeVisible();
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
