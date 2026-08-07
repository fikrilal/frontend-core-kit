import { expect, test, type Page } from "@playwright/test";

test("lists the current user sessions", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/sessions");
  await expect(
    page.getByRole("heading", { name: "Your sessions" }),
  ).toBeVisible();

  await expect(page.getByText("Dante's iPhone")).toBeVisible();
  await expect(page.getByText("Current session")).toBeVisible();
  await expect(page.getByText("active")).toBeVisible();

  await expect(page.getByText("Dante's MacBook")).toBeVisible();
  await expect(page.getByText("revoked")).toBeVisible();
});

test("protects the sessions route", async ({ page }) => {
  await page.goto("/app/sessions");
  await expect(page).toHaveURL(/\/login$/);
});

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}
