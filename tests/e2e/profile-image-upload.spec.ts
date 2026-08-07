import { expect, test, type Page } from "@playwright/test";

test("creates a profile image upload plan", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/profile");
  await page.locator("input[type='file']").setInputFiles({
    name: "avatar.webp",
    mimeType: "image/webp",
    buffer: Buffer.from("fake-webp-bytes"),
  });

  const prepareButton = page.getByRole("button", { name: "Prepare upload" });
  await expect(prepareButton).toBeEnabled();
  await prepareButton.click();

  await expect(
    page
      .getByRole("status")
      .getByText(
        "Upload plan ready. Next, confirm the upload to set your profile image.",
      ),
  ).toBeVisible();
});

test("maps upload rate limiting to safe feedback", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/profile");
  await page.locator("input[type='file']").setInputFiles({
    name: "avatar.webp",
    mimeType: "image/webp",
    // The fixture treats this declared size as rate-limited.
    buffer: Buffer.from("x".repeat(123)),
  });

  const prepareButton = page.getByRole("button", { name: "Prepare upload" });
  await expect(prepareButton).toBeEnabled();
  await prepareButton.click();

  await expect(
    page
      .locator("#profile-image-upload-error")
      .getByText("Too many upload requests. Please wait and try again."),
  ).toBeVisible();
});

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}
