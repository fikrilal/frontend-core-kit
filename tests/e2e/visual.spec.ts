import { expect, test, type Page } from "@playwright/test";

const screenshotOptions = {
  animations: "disabled" as const,
  caret: "initial" as const,
  fullPage: true,
};

test.use({
  colorScheme: "light",
  viewport: { width: 1280, height: 720 },
});

test("landing page matches the light visual baseline", async ({ page }) => {
  await openWithTheme(page, "/", "light");
  await expect(page).toHaveScreenshot("landing-light.png", screenshotOptions);
});

test("landing page matches the dark visual baseline", async ({ page }) => {
  await openWithTheme(page, "/", "dark");
  await expect(page).toHaveScreenshot("landing-dark.png", screenshotOptions);
});

test("login page and its failure state match their visual baselines", async ({
  page,
}) => {
  await openWithTheme(page, "/login", "light");
  await expect(page).toHaveScreenshot("login.png", screenshotOptions);

  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#login-error")).toBeVisible();
  await expect(page).toHaveScreenshot("login-error.png", screenshotOptions);

  await openWithTheme(page, "/login?reset=success", "light");
  await expect(page.locator("#password-reset-complete")).toBeVisible();
  await expect(page).toHaveScreenshot(
    "login-password-reset-success.png",
    screenshotOptions,
  );

  await openWithTheme(page, "/login?verified=success", "light");
  await expect(page.locator("#email-verification-complete")).toBeVisible();
  await expect(page).toHaveScreenshot(
    "login-email-verification-success.png",
    screenshotOptions,
  );
});

test("password reset page and its success state match their visual baselines", async ({
  page,
}) => {
  await openWithTheme(page, "/forgot-password", "light");
  await expect(page).toHaveScreenshot(
    "password-reset-request.png",
    screenshotOptions,
  );

  await page.getByLabel("Email").fill("user@example.com");
  await page.getByRole("button", { name: "Send reset instructions" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page).toHaveScreenshot(
    "password-reset-request-success.png",
    screenshotOptions,
  );
});

test("password reset confirmation page and its error state match their visual baselines", async ({
  page,
}) => {
  await openWithTheme(page, "/reset-password?token=valid-reset-token", "light");
  await expect(page).toHaveScreenshot(
    "password-reset-confirmation.png",
    screenshotOptions,
  );

  await page.goto("/reset-password?token=expired-reset-token");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("new-password-10");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(
    page.locator("#password-reset-confirmation-error"),
  ).toBeVisible();
  await expect(page).toHaveScreenshot(
    "password-reset-confirmation-error.png",
    screenshotOptions,
  );
});

test("email verification page and its error state match their visual baselines", async ({
  page,
}) => {
  await openWithTheme(
    page,
    "/verify-email?token=valid-verification-token",
    "light",
  );
  await expect(page).toHaveScreenshot(
    "email-verification.png",
    screenshotOptions,
  );

  await page.goto("/verify-email?token=expired-verification-token");
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page.locator("#email-verification-error")).toBeVisible();
  await expect(page).toHaveScreenshot(
    "email-verification-error.png",
    screenshotOptions,
  );
});

test("registration page and its failure state match their visual baselines", async ({
  page,
}) => {
  await openWithTheme(page, "/register", "light");
  await expect(page).toHaveScreenshot("register.png", screenshotOptions);

  await page.getByLabel("Email").fill("existing@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password-10");
  await page.getByLabel("Confirm password").fill("test-password-10");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("#register-error")).toBeVisible();
  await expect(page).toHaveScreenshot("register-error.png", screenshotOptions);
});

test("authenticated foundation matches its visual baseline", async ({
  page,
}) => {
  await openWithTheme(page, "/login", "light");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page).toHaveTitle("App | Frontend Core Kit");
  await expect(page).toHaveScreenshot("authenticated.png", screenshotOptions);
});

test("unverified authenticated foundation matches its visual baseline", async ({
  page,
}) => {
  await openWithTheme(page, "/register", "light");
  await page.getByLabel("Email").fill("new-user@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password-10");
  await page.getByLabel("Confirm password").fill("test-password-10");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page).toHaveScreenshot(
    "authenticated-unverified.png",
    screenshotOptions,
  );
});

test("profile editor and its saved state match their visual baselines", async ({
  page,
}) => {
  await openWithTheme(page, "/login", "light");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/profile");
  await expect(page).toHaveTitle("Profile | Frontend Core Kit");
  await expect(page).toHaveScreenshot("profile.png", screenshotOptions);

  await page.getByLabel("Display name").fill("Dante Alighieri");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(
    page.getByRole("status").getByText("Your profile was updated."),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("profile-saved.png", screenshotOptions);
});

test("sessions list matches its visual baseline", async ({ page }) => {
  await openWithTheme(page, "/login", "light");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/sessions");
  await expect(page).toHaveTitle("Sessions | Frontend Core Kit");
  await expect(page).toHaveScreenshot("sessions.png", screenshotOptions);
});

test("change-password page and its error state match their visual baselines", async ({
  page,
}) => {
  await openWithTheme(page, "/login", "light");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/password");
  await expect(page).toHaveTitle("Change password | Frontend Core Kit");
  await expect(page).toHaveScreenshot("change-password.png", screenshotOptions);

  await page.getByLabel("Current password").fill("wrong-password");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("new-password-10");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.locator("#change-password-error")).toBeVisible();
  await expect(page).toHaveScreenshot(
    "change-password-error.png",
    screenshotOptions,
  );
});

test("account-deletion request page matches its visual baseline", async ({
  page,
}) => {
  await openWithTheme(page, "/login", "light");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/account-deletion");
  await expect(page).toHaveTitle("Delete account | Frontend Core Kit");
  await expect(page).toHaveScreenshot(
    "account-deletion-request.png",
    screenshotOptions,
  );
});

test("account-deletion pending state matches its visual baseline", async ({
  page,
}) => {
  await openWithTheme(page, "/login", "light");
  await page.getByLabel("Email").fill("pending@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/account-deletion");
  await expect(page).toHaveTitle("Delete account | Frontend Core Kit");
  await expect(page).toHaveScreenshot(
    "account-deletion-pending.png",
    screenshotOptions,
  );
});

async function openWithTheme(
  page: Page,
  path: string,
  theme: "light" | "dark",
) {
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    ["theme", theme],
  );
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
}
