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

test("requests reset instructions without revealing account existence", async ({
  context,
  page,
}) => {
  const messages = [];

  for (const email of ["user@example.com", "unknown@example.com"]) {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset instructions" }).click();

    const status = page.getByRole("status");
    await expect(status).toContainText(
      "If an account exists for that email, you'll receive password reset instructions shortly.",
    );
    messages.push(await status.textContent());
    expect(
      (await context.cookies()).some(
        (cookie) => cookie.name === "lamara_session",
      ),
    ).toBe(false);
  }

  expect(messages[0]).toBe(messages[1]);
});

test("maps password reset rate limiting to safe frontend copy", async ({
  context,
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("rate-limited@example.com");
  await page.getByRole("button", { name: "Send reset instructions" }).click();

  await expect(
    page.getByText("Too many requests. Please wait and try again."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/forgot-password$/);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lamara_session",
    ),
  ).toBe(false);
});

test("confirms a password reset and redirects without a session", async ({
  context,
  page,
}) => {
  await page.goto("/reset-password?token=valid-reset-token");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("new-password-10");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect(page).toHaveURL(/\/login\?reset=success$/);
  await expect(page.getByRole("status")).toContainText(
    "Your password has been reset. Sign in with your new password.",
  );
  expect(page.url()).not.toContain("valid-reset-token");
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lamara_session",
    ),
  ).toBe(false);
  const browserOwnedState = await page.evaluate(() => ({
    localStorage: Object.entries(localStorage),
    sessionStorage: Object.entries(sessionStorage),
  }));
  expect(JSON.stringify(browserOwnedState)).not.toContain("valid-reset-token");
});

test("maps invalid and expired reset tokens to safe frontend copy", async ({
  context,
  page,
}) => {
  for (const token of ["invalid-reset-token", "expired-reset-token"]) {
    await page.goto(`/reset-password?token=${token}`);
    await page
      .getByLabel("New password", { exact: true })
      .fill("new-password-10");
    await page.getByLabel("Confirm new password").fill("new-password-10");
    await page.getByRole("button", { name: "Update password" }).click();

    await expect(
      page.getByText(
        "This password reset link is invalid or expired. Request a new one.",
      ),
    ).toBeVisible();
    await expect(page).toHaveURL(
      new RegExp(`/reset-password\\?token=${token}$`),
    );
    await expect(page.locator("body")).not.toContainText(
      "AUTH_PASSWORD_RESET_TOKEN",
    );
  }

  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lamara_session",
    ),
  ).toBe(false);
});

test("verifies an email and redirects without a new session", async ({
  context,
  page,
}) => {
  await page.goto("/verify-email?token=valid-verification-token");
  await expect(
    page.getByRole("heading", { name: "Verify your email" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Verify email" }).click();

  await expect(page).toHaveURL(/\/login\?verified=success$/);
  await expect(page.getByRole("status")).toContainText(
    "Your email has been verified. Sign in to continue.",
  );
  expect(page.url()).not.toContain("valid-verification-token");
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lamara_session",
    ),
  ).toBe(false);
  const browserOwnedState = await page.evaluate(() => ({
    localStorage: Object.entries(localStorage),
    sessionStorage: Object.entries(sessionStorage),
  }));
  expect(JSON.stringify(browserOwnedState)).not.toContain(
    "valid-verification-token",
  );
});

test("treats an already-verified email as a successful verification", async ({
  page,
}) => {
  await page.goto("/verify-email?token=already-verified-token");
  await page.getByRole("button", { name: "Verify email" }).click();

  await expect(page).toHaveURL(/\/login\?verified=success$/);
});

test("maps invalid and expired email verification tokens to safe copy", async ({
  context,
  page,
}) => {
  for (const token of [
    "invalid-verification-token",
    "expired-verification-token",
  ]) {
    await page.goto(`/verify-email?token=${token}`);
    await page.getByRole("button", { name: "Verify email" }).click();

    await expect(
      page.getByText(
        "This email verification link is invalid or expired. Return to sign in.",
      ),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/verify-email\\?token=${token}$`));
    await expect(page.locator("body")).not.toContainText(
      "AUTH_EMAIL_VERIFICATION_TOKEN",
    );
  }

  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lamara_session",
    ),
  ).toBe(false);
});

test("rejects a missing or repeated email verification token without calling the API", async ({
  page,
}) => {
  let verificationRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/v1/auth/email/verify")) {
      verificationRequests += 1;
    }
  });

  await page.goto("/verify-email");
  await expect(
    page.getByRole("status").filter({
      hasText: "This email verification link is invalid or expired.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to sign in" }),
  ).toBeVisible();

  await page.goto("/verify-email?token=valid-verification-token&token=other");
  await expect(
    page.getByRole("status").filter({
      hasText: "This email verification link is invalid or expired.",
    }),
  ).toBeVisible();
  expect(verificationRequests).toBe(0);
});

test("rejects a missing reset token without calling the API", async ({
  page,
}) => {
  let confirmationRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/v1/auth/password/reset/confirm")) {
      confirmationRequests += 1;
    }
  });

  await page.goto("/reset-password");
  await expect(
    page.getByRole("status").filter({
      hasText: "This password reset link is invalid or expired.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Request a new reset link" }),
  ).toBeVisible();
  expect(confirmationRequests).toBe(0);
});

test("rejects mismatched reset passwords before calling the API", async ({
  page,
}) => {
  let confirmationRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/v1/auth/password/reset/confirm")) {
      confirmationRequests += 1;
    }
  });

  await page.goto("/reset-password?token=valid-reset-token");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-10");
  await page.getByLabel("Confirm new password").fill("different-password");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect(
    page.getByText("Enter a matching password of at least 10 characters."),
  ).toBeVisible();
  expect(confirmationRequests).toBe(0);
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
