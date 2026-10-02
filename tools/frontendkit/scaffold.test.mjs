import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { check as checkPrettier } from "prettier";

import { parseCommand } from "./command.mjs";
import { CliUsageError } from "./result.mjs";
import { parseName, runScaffoldFeature } from "./scaffold.mjs";

test("parses feature and slice names into casing variants", () => {
  assert.deepEqual(parseName("billing"), {
    kebab: "billing",
    camel: "billing",
    pascal: "Billing",
    human: "Billing",
  });

  assert.deepEqual(parseName("order_tracking"), {
    kebab: "order-tracking",
    camel: "orderTracking",
    pascal: "OrderTracking",
    human: "Order Tracking",
  });

  assert.deepEqual(parseName("team-members"), {
    kebab: "team-members",
    camel: "teamMembers",
    pascal: "TeamMembers",
    human: "Team Members",
  });
});

test("parses scaffold feature commands and options", () => {
  assert.deepEqual(parseCommand(["scaffold", "feature", "billing"]), {
    kind: "scaffold-feature",
    format: "human",
    options: {
      feature: "billing",
      slice: undefined,
      kind: "authenticated",
      dryRun: false,
      force: false,
    },
  });

  assert.deepEqual(
    parseCommand([
      "scaffold",
      "feature",
      "billing",
      "--slice",
      "portal",
      "--kind",
      "marketing",
      "--dry-run",
      "--force",
    ]),
    {
      kind: "scaffold-feature",
      format: "human",
      options: {
        feature: "billing",
        slice: "portal",
        kind: "marketing",
        dryRun: true,
        force: true,
      },
    },
  );
});

test("rejects malformed scaffold commands and arguments", () => {
  assert.throws(() => parseCommand(["scaffold", "unknown"]), CliUsageError);
  assert.throws(() => parseCommand(["scaffold", "feature"]), CliUsageError);
  assert.throws(
    () => parseCommand(["scaffold", "feature", "billing", "--slice"]),
    CliUsageError,
  );
  assert.throws(
    () => parseCommand(["scaffold", "feature", "billing", "--kind", "invalid"]),
    CliUsageError,
  );
  assert.throws(
    () => parseCommand(["scaffold", "feature", "billing", "--unknown"]),
    CliUsageError,
  );
  assert.throws(
    () => parseCommand(["scaffold", "feature", "billing", "extra"]),
    CliUsageError,
  );
});

test("validates feature and slice name format", () => {
  assert.equal(
    runScaffoldFeature({ feature: "Invalid_Name" }).status,
    "failed",
  );
  assert.equal(
    runScaffoldFeature({ feature: "billing", slice: "UPPER" }).status,
    "failed",
  );
  assert.equal(runScaffoldFeature({ feature: "123_invalid" }).status, "failed");
});

test("dry-run previews generated files without writing", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-dry-run-"));
  try {
    const result = runScaffoldFeature(
      { feature: "billing", dryRun: true },
      { root },
    );
    assert.equal(result.status, "passed");
    assert.match(result.summary, /Dry run: would scaffold feature "billing"/);
    assert.equal(fs.readdirSync(root).length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("refuses to overwrite existing files without --force", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-collision-"));
  try {
    const existingFile = path.join(
      root,
      "src/features/billing/billing/billing-page.tsx",
    );
    fs.mkdirSync(path.dirname(existingFile), { recursive: true });
    fs.writeFileSync(existingFile, "// existing", "utf8");

    const result = runScaffoldFeature({ feature: "billing" }, { root });
    assert.equal(result.status, "failed");
    assert.match(result.summary, /Refusing to scaffold/);

    const forcedResult = runScaffoldFeature(
      { feature: "billing", force: true },
      { root },
    );
    assert.equal(forcedResult.status, "passed");
    assert.notEqual(fs.readFileSync(existingFile, "utf8"), "// existing");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scaffolds a complete authenticated feature slice", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-auth-"));
  try {
    const result = runScaffoldFeature({ feature: "billing" }, { root });
    assert.equal(result.status, "passed");

    const expectedFiles = [
      "src/app/(authenticated)/billing/page.tsx",
      "src/features/billing/index.ts",
      "src/features/billing/billing/billing-page.tsx",
      "src/features/billing/billing/billing-form.tsx",
      "src/features/billing/billing/billing-action.ts",
      "src/features/billing/billing/billing-state.ts",
      "src/features/billing/billing/billing-failure.ts",
      "src/features/billing/billing/billing-action.test.ts",
      "src/features/billing/billing/billing-failure.test.ts",
    ];

    for (const file of expectedFiles) {
      assert.ok(
        fs.existsSync(path.join(root, file)),
        `Expected ${file} to exist`,
      );
    }

    const routeContent = fs.readFileSync(
      path.join(root, "src/app/(authenticated)/billing/page.tsx"),
      "utf8",
    );
    assert.match(routeContent, /import \{ BillingPage \} from "@/);
    assert.match(routeContent, /export default function BillingPageRoute/);
    assert.ok(routeContent.split("\n").length <= 20, "Route file must be thin");

    const indexContent = fs.readFileSync(
      path.join(root, "src/features/billing/index.ts"),
      "utf8",
    );
    assert.match(indexContent, /export \{ BillingPage \}/);

    const formContent = fs.readFileSync(
      path.join(root, "src/features/billing/billing/billing-form.tsx"),
      "utf8",
    );
    assert.match(formContent, /"use client"/);
    assert.match(formContent, /useActionState/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("wires marketing routes into site-metadata.ts when kind is marketing", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-mkt-"));
  try {
    const siteMetadataDir = path.join(root, "src/app");
    fs.mkdirSync(siteMetadataDir, { recursive: true });
    fs.writeFileSync(
      path.join(siteMetadataDir, "site-metadata.ts"),
      `export const publicRoutes = [\n  {\n    path: "/",\n    priority: 1,\n  },\n] as const;\n`,
      "utf8",
    );

    const result = runScaffoldFeature(
      { feature: "pricing", kind: "marketing" },
      { root },
    );
    assert.equal(result.status, "passed");

    assert.ok(
      fs.existsSync(path.join(root, "src/app/(marketing)/pricing/page.tsx")),
    );

    const metadataContent = fs.readFileSync(
      path.join(siteMetadataDir, "site-metadata.ts"),
      "utf8",
    );
    assert.match(metadataContent, /path: "\/pricing"/);
    assert.match(metadataContent, /priority: 0\.8/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("appends second slice export to existing feature index.ts", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-multi-slice-"));
  try {
    runScaffoldFeature({ feature: "billing", slice: "overview" }, { root });
    runScaffoldFeature({ feature: "billing", slice: "invoices" }, { root });

    const indexContent = fs.readFileSync(
      path.join(root, "src/features/billing/index.ts"),
      "utf8",
    );
    assert.match(indexContent, /export \{ BillingOverviewPage \}/);
    assert.match(indexContent, /export \{ BillingInvoicesPage \}/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scaffolds feature output that is 100% Prettier-canonical across varied name shapes", async () => {
  const testCases = [
    { feature: "billing" },
    { feature: "pricing", slice: "tiers", kind: "marketing" },
    { feature: "invoicing" },
    { feature: "order-tracking-details", slice: "invoice-summary" },
  ];

  for (const tc of testCases) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-fmt-check-"));
    try {
      // @ts-expect-error test arguments
      const res = runScaffoldFeature(tc, { root });
      assert.equal(res.status, "passed");

      // Walk all files in root
      /** @type {string[]} */
      const files = [];
      /** @param {string} dir */
      function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else files.push(full);
        }
      }
      walk(root);

      assert.ok(files.length >= 8);
      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        const formatted = await checkPrettier(content, { filepath: file });
        assert.ok(
          formatted,
          `File ${file} failed Prettier check for case ${tc.feature} ${tc.slice || ""}`,
        );
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});
