import { expect, test } from "@playwright/test";

test("renders the landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Burnly home" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Track AI coding-tool tokens from your tray/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Download", exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Supported coding agents/i }),
  ).toBeVisible();
});

test("renders the initial public pages", async ({ page }) => {
  await page.goto("/download");
  await expect(
    page.getByRole("heading", { name: /Install Burnly/i }),
  ).toBeVisible();
});
