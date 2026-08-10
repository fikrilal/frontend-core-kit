import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(rootDir, "src"),
      "server-only": path.join(rootDir, "src/test/server-only-mock.ts"),
    },
  },
  test: {
    environment: "jsdom",
    exclude: [
      "scripts/contracts/**",
      "scripts/harness/**",
      "scripts/testing/**",
      "tools/frontendkit/**",
      "tests/e2e/**",
      "node_modules/**",
      ".next/**",
    ],
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
  },
});
