import { expect, test, type Page } from "@playwright/test";

test("changes the password and shows safe success feedback", async ({
  page,
}) => {
  await signIn(page);

  await page.goto("/app/password");
  await expect(
    page.getByRole("heading", { name: "Change your password" }),
  ).toBeVisible();

  await page.getByLabel("Current password").fill("test-password");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("new-password-10");
  await page.getByRole("button", { name: "Change password" }).click();

  await expect(
    page.getByRole("status").getByText("Your password was changed."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/password$/);
});

test("maps an invalid current password to safe feedback", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/password");
  await page.getByLabel("Current password").fill("wrong-password");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("new-password-10");
  await page.getByRole("button", { name: "Change password" }).click();

  await expect(
    page
      .locator("#change-password-error")
      .getByText("The current password is incorrect."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/password$/);
});

test("rejects a mismatched confirmation without calling the API", async ({
  page,
}) => {
  await signIn(page);

  await page.goto("/app/password");
  await page.getByLabel("Current password").fill("test-password");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("different-password");
  await page.getByRole("button", { name: "Change password" }).click();

  await expect(
    page
      .locator("#change-password-error")
      .getByText(
        "Enter your current password and a matching new password of at least 10 characters.",
      ),
  ).toBeVisible();
});

test("protects the change-password route", async ({ page }) => {
  await page.goto("/app/password");
  await expect(page).toHaveURL(/\/login$/);
});

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}
