import fs from "node:fs";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

/**
 * Load .env / .env.local into process.env (without overriding existing keys)
 * so Playwright cookie fixtures and the webServer share SESSION_SECRET.
 */
function loadEnvFiles() {
  for (const name of [".env", ".env.local"] as const) {
    const filePath = path.join(process.cwd(), name);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq <= 0) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] ??= value;
    }
  }
}

loadEnvFiles();

/** Match `env.ts` default when SESSION_SECRET is unset. */
const e2eSessionSecret =
  process.env.SESSION_SECRET ?? "local-dev-only-lamara-session-secret-key!!";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      // Force the same secret the cookie fixture seals with.
      SESSION_SECRET: e2eSessionSecret,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
