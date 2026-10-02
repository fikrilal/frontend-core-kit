import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseCommand } from "./command.mjs";
import { runRemoveFeature } from "./remove.mjs";
import { CliUsageError } from "./result.mjs";
import { runScaffoldData } from "./scaffold-data.mjs";
import { runScaffoldFeature } from "./scaffold.mjs";

function makeRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "frontendkit-remove-"));
}

/** @param {string} root */
function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test("parses remove feature commands and options", () => {
  assert.deepEqual(parseCommand(["remove", "feature", "billing"]), {
    kind: "remove-feature",
    format: "human",
    options: {
      feature: "billing",
      slice: undefined,
      dryRun: false,
      forceCore: false,
      yes: false,
    },
  });

  assert.deepEqual(
    parseCommand([
      "remove",
      "feature",
      "billing",
      "--slice",
      "invoices",
      "--dry-run",
      "--force-core",
      "--yes",
    ]),
    {
      kind: "remove-feature",
      format: "human",
      options: {
        feature: "billing",
        slice: "invoices",
        dryRun: true,
        forceCore: true,
        yes: true,
      },
    },
  );

  assert.throws(() => parseCommand(["remove"]), CliUsageError);
  assert.throws(() => parseCommand(["remove", "feature"]), CliUsageError);
  assert.throws(
    () => parseCommand(["remove", "feature", "billing", "extra"]),
    CliUsageError,
  );
  assert.throws(
    () => parseCommand(["remove", "feature", "billing", "--unknown"]),
    CliUsageError,
  );
  assert.throws(
    () => parseCommand(["remove", "feature", "billing", "--slice"]),
    CliUsageError,
  );
});

test("refuses protected core features without --force-core", () => {
  const root = makeRoot();
  try {
    for (const feature of ["auth", "marketing", "users"]) {
      const result = runRemoveFeature({ feature }, { root });
      assert.equal(result.status, "failed");
      const blocker = result.details.find(
        (detail) => detail.name === "blocker-code",
      );
      assert.equal(blocker?.value, "core-feature-protected");
    }
  } finally {
    cleanup(root);
  }
});

test("--force-core dry run previews a protected feature without deleting", () => {
  const root = makeRoot();
  try {
    const featureDir = path.join(root, "src/features/auth");
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(path.join(featureDir, "index.ts"), "export {};\n", "utf8");

    const result = runRemoveFeature(
      { feature: "auth", forceCore: true, dryRun: true },
      { root },
    );
    assert.equal(result.status, "passed");
    assert.match(result.summary, /Dry run/);
    assert.ok(
      fs.existsSync(featureDir),
      "dry run must not delete the feature directory",
    );
  } finally {
    cleanup(root);
  }
});

test("aborts when another feature imports the removed feature", () => {
  const root = makeRoot();
  try {
    runScaffoldFeature({ feature: "billing" }, { root });
    const consumer = path.join(root, "src/features/other/other-consumer.ts");
    fs.mkdirSync(path.dirname(consumer), { recursive: true });
    fs.writeFileSync(
      consumer,
      'import { BillingPage } from "@/features/billing";\n',
      "utf8",
    );

    const result = runRemoveFeature({ feature: "billing" }, { root });
    assert.equal(result.status, "failed");
    assert.ok(
      result.details.some(
        (detail) =>
          detail.name === "referencing-file-1" &&
          String(detail.value).includes("other-consumer.ts"),
      ),
    );
    assert.ok(
      fs.existsSync(path.join(root, "src/features/billing")),
      "must not delete a referenced feature",
    );
  } finally {
    cleanup(root);
  }
});

test("removes a scaffolded feature with its route and data adapter", () => {
  const root = makeRoot();
  try {
    runScaffoldFeature({ feature: "billing" }, { root });
    runScaffoldData(
      { feature: "billing", operation: "users.me.get" },
      { root },
    );
    const featureDir = path.join(root, "src/features/billing");
    const routeDir = path.join(root, "src/app/(authenticated)/billing");
    assert.ok(fs.existsSync(featureDir));
    assert.ok(fs.existsSync(routeDir));

    const result = runRemoveFeature({ feature: "billing" }, { root });
    assert.equal(result.status, "passed");
    assert.equal(fs.existsSync(featureDir), false);
    assert.equal(fs.existsSync(routeDir), false);
    assert.equal(
      result.details.find((detail) => detail.name === "removed-paths")?.value,
      2,
    );
  } finally {
    cleanup(root);
  }
});

test("prunes marketing publicRoutes entries", () => {
  const root = makeRoot();
  try {
    const appDir = path.join(root, "src/app");
    fs.mkdirSync(appDir, { recursive: true });
    fs.writeFileSync(
      path.join(appDir, "site-metadata.ts"),
      `export const publicRoutes = [\n  {\n    path: "/",\n    priority: 1,\n  },\n] as const;\n`,
      "utf8",
    );

    runScaffoldFeature(
      { feature: "pricing", slice: "tiers", kind: "marketing" },
      { root },
    );
    const metadataPath = path.join(appDir, "site-metadata.ts");
    assert.match(fs.readFileSync(metadataPath, "utf8"), /"\/pricing\/tiers"/);

    const result = runRemoveFeature({ feature: "pricing" }, { root });
    assert.equal(result.status, "passed");

    const content = fs.readFileSync(metadataPath, "utf8");
    assert.doesNotMatch(content, /pricing/);
    assert.match(content, /path: "\/"/);
    assert.equal(fs.existsSync(path.join(root, "src/features/pricing")), false);
    assert.equal(
      fs.existsSync(path.join(root, "src/app/(marketing)/pricing")),
      false,
    );
  } finally {
    cleanup(root);
  }
});

test("removes a single slice and prunes its public export", () => {
  const root = makeRoot();
  try {
    runScaffoldFeature({ feature: "billing", slice: "overview" }, { root });
    runScaffoldFeature({ feature: "billing", slice: "invoices" }, { root });

    const featureDir = path.join(root, "src/features/billing");
    const indexPath = path.join(featureDir, "index.ts");
    const indexContent = fs.readFileSync(indexPath, "utf8");
    assert.match(indexContent, /BillingOverviewPage/);
    assert.match(indexContent, /BillingInvoicesPage/);

    const result = runRemoveFeature(
      { feature: "billing", slice: "invoices" },
      { root },
    );
    assert.equal(result.status, "passed");
    assert.equal(fs.existsSync(path.join(featureDir, "invoices")), false);
    assert.ok(fs.existsSync(path.join(featureDir, "overview")));
    assert.equal(
      fs.existsSync(
        path.join(root, "src/app/(authenticated)/billing/invoices"),
      ),
      false,
    );

    const updatedIndex = fs.readFileSync(indexPath, "utf8");
    assert.doesNotMatch(updatedIndex, /BillingInvoicesPage/);
    assert.match(updatedIndex, /BillingOverviewPage/);
    assert.equal(
      result.details.find((detail) => detail.name === "index-updated")?.value,
      true,
    );
  } finally {
    cleanup(root);
  }
});

test("dry run reports planned deletions without touching disk", () => {
  const root = makeRoot();
  try {
    runScaffoldFeature({ feature: "billing" }, { root });

    const result = runRemoveFeature(
      { feature: "billing", dryRun: true },
      { root },
    );
    assert.equal(result.status, "passed");
    assert.ok(fs.existsSync(path.join(root, "src/features/billing")));
    assert.ok(
      fs.existsSync(path.join(root, "src/app/(authenticated)/billing")),
    );
    assert.ok(
      result.details.some((detail) => detail.name.startsWith("would-remove-")),
    );
  } finally {
    cleanup(root);
  }
});

test("fails for missing features, slices, and invalid names", () => {
  const root = makeRoot();
  try {
    assert.equal(
      runRemoveFeature({ feature: "billing" }, { root }).status,
      "failed",
    );
    assert.equal(
      runRemoveFeature({ feature: "Bad_Name" }, { root }).status,
      "failed",
    );
    assert.equal(
      runRemoveFeature({ feature: "billing", slice: "UPPER" }, { root }).status,
      "failed",
    );
  } finally {
    cleanup(root);
  }
});

test("aborts slice removal when an external consumer uses the slice export", () => {
  const root = makeRoot();
  try {
    runScaffoldFeature({ feature: "billing", slice: "overview" }, { root });
    runScaffoldFeature({ feature: "billing", slice: "invoices" }, { root });

    const consumer = path.join(root, "src/features/other/consumer.ts");
    fs.mkdirSync(path.dirname(consumer), { recursive: true });
    fs.writeFileSync(
      consumer,
      'import { BillingInvoicesPage } from "@/features/billing";\n\nexport const consumer = BillingInvoicesPage;\n',
      "utf8",
    );

    const result = runRemoveFeature(
      { feature: "billing", slice: "invoices" },
      { root },
    );
    assert.equal(result.status, "failed");
    const reference = result.details.find(
      (detail) => detail.name === "referencing-file-1",
    );
    assert.ok(reference);
    assert.ok(String(reference.value).includes("consumer.ts"));
    assert.ok(String(reference.value).includes("BillingInvoicesPage"));
    assert.ok(fs.existsSync(path.join(root, "src/features/billing/invoices")));
  } finally {
    cleanup(root);
  }
});

test("allows slice removal when barrel consumers use only other slices", () => {
  const root = makeRoot();
  try {
    runScaffoldFeature({ feature: "billing", slice: "overview" }, { root });
    runScaffoldFeature({ feature: "billing", slice: "invoices" }, { root });

    const consumer = path.join(root, "src/features/other/consumer.ts");
    fs.mkdirSync(path.dirname(consumer), { recursive: true });
    fs.writeFileSync(
      consumer,
      'import { BillingOverviewPage } from "@/features/billing";\n\nexport const consumer = BillingOverviewPage;\n',
      "utf8",
    );

    const result = runRemoveFeature(
      { feature: "billing", slice: "invoices" },
      { root },
    );
    assert.equal(result.status, "passed");
    assert.equal(
      fs.existsSync(path.join(root, "src/features/billing/invoices")),
      false,
    );
    assert.ok(fs.existsSync(consumer));
  } finally {
    cleanup(root);
  }
});

test("aborts when a relative import resolves into the removed feature", () => {
  const root = makeRoot();
  try {
    runScaffoldFeature({ feature: "billing" }, { root });

    const consumer = path.join(root, "src/features/zeta/consumer.ts");
    fs.mkdirSync(path.dirname(consumer), { recursive: true });
    fs.writeFileSync(
      consumer,
      'import { BillingPage } from "../billing";\n\nexport const consumer = BillingPage;\n',
      "utf8",
    );

    const result = runRemoveFeature({ feature: "billing" }, { root });
    assert.equal(result.status, "failed");
    const reference = result.details.find(
      (detail) => detail.name === "referencing-file-1",
    );
    assert.ok(reference);
    assert.ok(String(reference.value).includes("consumer.ts"));
    assert.ok(fs.existsSync(path.join(root, "src/features/billing")));
  } finally {
    cleanup(root);
  }
});

test("blocks on relative slice imports and ignores sibling slice imports", () => {
  const root = makeRoot();
  try {
    runScaffoldFeature({ feature: "billing", slice: "overview" }, { root });
    runScaffoldFeature({ feature: "billing", slice: "invoices" }, { root });

    const zetaDir = path.join(root, "src/features/zeta");
    fs.mkdirSync(zetaDir, { recursive: true });
    const sliceConsumer = path.join(zetaDir, "slice-consumer.ts");
    fs.writeFileSync(
      sliceConsumer,
      'import { BillingInvoicesPage } from "../billing/invoices/invoices-page";\n\nexport const consumer = BillingInvoicesPage;\n',
      "utf8",
    );
    const siblingConsumer = path.join(zetaDir, "sibling-consumer.ts");
    fs.writeFileSync(
      siblingConsumer,
      'import { BillingOverviewPage } from "../billing/overview/overview-page";\n\nexport const consumer = BillingOverviewPage;\n',
      "utf8",
    );

    const blocked = runRemoveFeature(
      { feature: "billing", slice: "invoices" },
      { root },
    );
    assert.equal(blocked.status, "failed");
    const reference = blocked.details.find(
      (detail) => detail.name === "referencing-file-1",
    );
    assert.ok(reference);
    assert.ok(String(reference.value).includes("slice-consumer.ts"));

    fs.rmSync(sliceConsumer);
    const allowed = runRemoveFeature(
      { feature: "billing", slice: "invoices" },
      { root },
    );
    assert.equal(allowed.status, "passed");
    assert.ok(fs.existsSync(siblingConsumer));
  } finally {
    cleanup(root);
  }
});
