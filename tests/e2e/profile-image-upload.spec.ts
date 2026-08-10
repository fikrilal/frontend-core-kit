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

test("confirms a profile image upload", async ({ page }) => {
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
    page.getByRole("button", { name: "Confirm upload" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Confirm upload" }).click();

  await expect(
    page.getByRole("status").getByText("Your profile image was updated."),
  ).toBeVisible();
});

test("maps a missing upload to safe feedback", async ({ page }) => {
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
    page.getByRole("button", { name: "Confirm upload" }),
  ).toBeVisible();

  // Swap the file id to the fixture's missing sentinel before confirming.
  await page.locator("input[name='fileId']").evaluate((input) => {
    (input as HTMLInputElement).value = "missing-file-id";
  });
  await page.getByRole("button", { name: "Confirm upload" }).click();

  await expect(
    page
      .locator("#profile-image-complete-error")
      .getByText("This upload no longer exists. Start again."),
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
