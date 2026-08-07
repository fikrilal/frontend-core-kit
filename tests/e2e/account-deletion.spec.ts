import { expect, test, type Page } from "@playwright/test";

test("requests account deletion and shows safe success feedback", async ({
  page,
}) => {
  await signIn(page);

  await page.goto("/app/account-deletion");
  await expect(
    page.getByRole("heading", { name: "Delete your account" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Request account deletion" }).click();

  await expect(
    page.getByRole("status").getByText("Your account deletion was scheduled."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/account-deletion$/);
});

test("shows a pending deletion state when one is already scheduled", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("pending@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/account-deletion");
  await expect(
    page.getByText("A deletion request is already in progress."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request account deletion" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Cancel account deletion" }),
  ).toBeVisible();
});

test("cancels a pending account deletion and shows safe success feedback", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("pending@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/account-deletion");
  await page.getByRole("button", { name: "Cancel account deletion" }).click();

  await expect(
    page.getByRole("status").getByText("Your account deletion was canceled."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/account-deletion$/);
});

test("protects the account-deletion route", async ({ page }) => {
  await page.goto("/app/account-deletion");
  await expect(page).toHaveURL(/\/login$/);
});

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}
