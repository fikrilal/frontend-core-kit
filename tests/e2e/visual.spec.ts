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
});

test("authenticated foundation matches its visual baseline", async ({
  page,
}) => {
  await openWithTheme(page, "/login", "light");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page).toHaveTitle("App | Lamara");
  await expect(page).toHaveScreenshot("authenticated.png", screenshotOptions);
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
