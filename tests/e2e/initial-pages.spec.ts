import { expect, test } from "@playwright/test";

test("renders the landing page and its active navigation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Track AI coding-tool usage from your tray.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Codex", { exact: true })).toBeVisible();
  await expect(page.getByText("Claude Code", { exact: true })).toBeVisible();
  await expect(page.getByText("OpenCode", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page).toHaveURL(/#privacy$/);
  await expect(
    page.getByRole("heading", { name: "Usage totals, not your work." }),
  ).toBeVisible();
});

test("serves required metadata endpoints", async ({ request }) => {
  for (const path of [
    "/manifest.webmanifest",
    "/robots.txt",
    "/sitemap.xml",
    "/opengraph-image",
    "/twitter-image",
    "/icon.svg",
  ]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should return 2xx`).toBe(true);
  }
});

test("does not expose deferred product routes", async ({ request }) => {
  for (const path of ["/download", "/login", "/dashboard", "/reports"]) {
    const response = await request.get(path);
    expect(response.status(), `${path} should remain unimplemented`).toBe(404);
  }
});
