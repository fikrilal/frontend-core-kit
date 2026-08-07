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

test("revokes a session and shows safe success feedback", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/sessions");

  // The current session has no revoke affordance.
  const currentRow = page.locator("li", { hasText: "Dante's iPhone" });
  await expect(currentRow.getByRole("button", { name: "Revoke" })).toHaveCount(
    0,
  );

  const oldRow = page.locator("li", { hasText: "Dante's MacBook" });
  await oldRow.getByRole("button", { name: "Revoke" }).click();

  await expect(oldRow.getByRole("status").getByText("Revoked.")).toBeVisible();
  await expect(oldRow.getByRole("button", { name: "Revoke" })).toBeDisabled();
});

test("maps a missing session to safe feedback", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/sessions");
  const row = page.locator("li", { hasText: "Unknown device" });
  await row.getByRole("button", { name: "Revoke" }).click();

  await expect(
    row.getByRole("alert").getByText("This session no longer exists."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/sessions$/);
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
