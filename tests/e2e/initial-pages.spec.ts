import { expect, test } from "@playwright/test";

test("renders the generic landing page and opens sign in", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Lamara is taking shape." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Sign in", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
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

test("does not expose an arbitrary nonexistent route", async ({ request }) => {
  const response = await request.get("/not-a-real-route");
  expect(response.status()).toBe(404);
});

test("protects the authenticated route", async ({ page }) => {
  await page.goto("/app");

  await expect(page).toHaveURL(/\/login$/);
});

test("maps a backend login code to safe frontend copy", async ({
  context,
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByText("The email or password is incorrect."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lamara_session",
    ),
  ).toBe(false);
});

test("maps an existing registration email to safe frontend copy", async ({
  context,
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill("existing@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password-10");
  await page.getByLabel("Confirm password").fill("test-password-10");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("An account with this email already exists."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lamara_session",
    ),
  ).toBe(false);
});

test("registers a user with an opaque cookie and verification guidance", async ({
  context,
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill("new-user@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password-10");
  await page.getByLabel("Confirm password").fill("test-password-10");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: "You are signed in." }),
  ).toBeVisible();
  await expect(page.getByText("new-user@example.com")).toBeVisible();
  await expect(page.locator('[role="status"]')).toContainText(
    "Check your inbox to verify your email address.",
  );

  const sessionCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "lamara_session",
  );
  expect(sessionCookie).toMatchObject({
    httpOnly: true,
    sameSite: "Lax",
  });
  const browserOwnedState = await page.evaluate(() => ({
    html: document.documentElement.outerHTML,
    localStorage: Object.entries(localStorage),
    sessionStorage: Object.entries(sessionStorage),
  }));
  expect(JSON.stringify(browserOwnedState)).not.toContain(
    "e2e-registration-refresh-token",
  );
  expect(JSON.stringify(browserOwnedState)).not.toContain(".signature");
});

test("signs in with an opaque cookie and signs out", async ({
  context,
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: "You are signed in." }),
  ).toBeVisible();
  await expect(page.getByText("user@example.com")).toBeVisible();

  const sessionCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "lamara_session",
  );
  expect(sessionCookie).toMatchObject({
    httpOnly: true,
    sameSite: "Lax",
  });
  expect(sessionCookie?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);

  const browserOwnedState = await page.evaluate(() => ({
    html: document.documentElement.outerHTML,
    localStorage: Object.entries(localStorage),
    sessionStorage: Object.entries(sessionStorage),
  }));
  expect(JSON.stringify(browserOwnedState)).not.toContain("e2e-refresh-token");
  expect(JSON.stringify(browserOwnedState)).not.toContain(".signature");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lamara_session",
    ),
  ).toBe(false);
});
