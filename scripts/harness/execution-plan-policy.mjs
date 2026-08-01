import path from "node:path";

export const planFolders = ["active", "queued", "completed"];

const legacyCompletedPlans = new Set([
  "2026-07-28_api-contract-foundation.md",
  "2026-07-28_password-login-api-client.md",
  "2026-07-29_generated-runtime-contracts-node24.md",
  "2026-07-30_generic-auth-session-foundation.md",
]);

export function isLegacyCompletedPlan(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  return (
    normalized.startsWith("docs/exec-plans/completed/") &&
    legacyCompletedPlans.has(path.posix.basename(normalized))
  );
}
