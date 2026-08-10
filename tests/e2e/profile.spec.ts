import { expect, test, type Page } from "@playwright/test";

test("edits the profile through the authenticated patch endpoint", async ({
  context,
  page,
}) => {
  await signIn(page);

  await page.goto("/app/profile");
  await expect(
    page.getByRole("heading", { name: "Your profile" }),
  ).toBeVisible();

  const displayName = page.getByLabel("Display name");
  await expect(displayName).toHaveValue("Example User");
  await expect(page.getByLabel("Given name")).toHaveValue("Example");
  await expect(page.getByLabel("Family name")).toHaveValue("");

  await displayName.fill("Dante Alighieri");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(
    page
      .getByRole("status", { name: "" })
      .getByText("Your profile was updated."),
  ).toBeVisible();
  await expect(displayName).toHaveValue("Dante Alighieri");

  const sessionCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "frontend_core_session",
  );
  expect(sessionCookie?.httpOnly).toBe(true);
});

test("maps a profile conflict to safe feedback", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/profile");
  await page.getByLabel("Display name").fill("conflict-display-name");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(
    page
      .getByRole("alert")
      .getByText("Your profile could not be saved. Refresh and try again."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/profile$/);
});

test("protects the profile route", async ({ page }) => {
  await page.goto("/app/profile");
  await expect(page).toHaveURL(/\/login$/);
});

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}
