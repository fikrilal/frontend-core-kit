import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseCommand } from "./command.mjs";
import { CliUsageError } from "./result.mjs";
import {
  findOpenApiOperation,
  parseOpenApiSpec,
  parseOperationId,
  parseScaffoldAllArguments,
  parseScaffoldDataArguments,
  runScaffoldAll,
  runScaffoldData,
} from "./scaffold-data.mjs";

test("parses operationId into camelCase and PascalCase variants", () => {
  assert.deepEqual(parseOperationId("users.me.get"), {
    parts: ["users", "me", "get"],
    camel: "usersMeGet",
    pascal: "UsersMeGet",
    kebab: "users-me-get",
  });

  assert.deepEqual(parseOperationId("auth.password.register"), {
    parts: ["auth", "password", "register"],
    camel: "authPasswordRegister",
    pascal: "AuthPasswordRegister",
    kebab: "auth-password-register",
  });

  assert.deepEqual(parseOperationId("admin.users.role.patch"), {
    parts: ["admin", "users", "role", "patch"],
    camel: "adminUsersRolePatch",
    pascal: "AdminUsersRolePatch",
    kebab: "admin-users-role-patch",
  });
});

test("parses scaffold data commands and options", () => {
  assert.deepEqual(
    parseCommand([
      "scaffold",
      "data",
      "--feature",
      "billing",
      "--operation",
      "users.me.get",
    ]),
    {
      kind: "scaffold-data",
      format: "human",
      options: {
        feature: "billing",
        operation: "users.me.get",
        openapiSpec: "",
        dryRun: false,
        force: false,
        list: false,
        filter: "",
      },
    },
  );

  assert.deepEqual(
    parseCommand([
      "scaffold",
      "data",
      "-f",
      "billing",
      "-o",
      "users.me.get",
      "--openapi-spec",
      "spec.yaml",
      "--dry-run",
      "--force",
    ]),
    {
      kind: "scaffold-data",
      format: "human",
      options: {
        feature: "billing",
        operation: "users.me.get",
        openapiSpec: "spec.yaml",
        dryRun: true,
        force: true,
        list: false,
        filter: "",
      },
    },
  );

  assert.deepEqual(parseCommand(["scaffold", "data", "--list"]), {
    kind: "scaffold-data",
    format: "human",
    options: {
      feature: "",
      operation: "",
      openapiSpec: "",
      dryRun: false,
      force: false,
      list: true,
      filter: "",
    },
  });
});

test("parses scaffold all commands and options", () => {
  assert.deepEqual(
    parseCommand([
      "scaffold",
      "all",
      "--feature",
      "billing",
      "--operation",
      "users.me.get",
    ]),
    {
      kind: "scaffold-all",
      format: "human",
      options: {
        feature: "billing",
        operation: "users.me.get",
        slice: undefined,
        kind: "authenticated",
        openapiSpec: "",
        dryRun: false,
        force: false,
      },
    },
  );

  assert.deepEqual(
    parseCommand([
      "scaffold",
      "all",
      "-f",
      "billing",
      "-o",
      "users.me.get",
      "--slice",
      "invoices",
      "--kind",
      "marketing",
      "--dry-run",
      "--force",
    ]),
    {
      kind: "scaffold-all",
      format: "human",
      options: {
        feature: "billing",
        operation: "users.me.get",
        slice: "invoices",
        kind: "marketing",
        openapiSpec: "",
        dryRun: true,
        force: true,
      },
    },
  );
});

test("rejects invalid scaffold data and all options", () => {
  assert.throws(() => parseScaffoldDataArguments([]), CliUsageError);
  assert.throws(
    () => parseScaffoldDataArguments(["--feature", "billing"]),
    CliUsageError,
  );
  assert.throws(
    () => parseScaffoldDataArguments(["--operation", "users.me.get"]),
    CliUsageError,
  );
  assert.throws(() => parseScaffoldDataArguments(["--unknown"]), CliUsageError);

  assert.throws(() => parseScaffoldAllArguments([]), CliUsageError);
  assert.throws(
    () => parseScaffoldAllArguments(["--feature", "billing"]),
    CliUsageError,
  );
  assert.throws(
    () => parseScaffoldAllArguments(["--operation", "users.me.get"]),
    CliUsageError,
  );
  assert.throws(
    () =>
      parseScaffoldAllArguments([
        "--feature",
        "billing",
        "--operation",
        "users.me.get",
        "--kind",
        "invalid",
      ]),
    CliUsageError,
  );
});

test("parses OpenAPI spec and resolves operations by id, method, and alias", () => {
  const operations = parseOpenApiSpec("src/contracts/example-api/openapi.yaml");
  assert.ok(operations.length > 20);

  // Exact match
  const meGet = findOpenApiOperation(operations, "users.me.get");
  assert.ok(meGet);
  assert.equal(meGet.operationId, "users.me.get");
  assert.equal(meGet.httpMethod, "GET");
  assert.equal(meGet.path, "/v1/me");
  assert.equal(meGet.requiresAuth, true);

  // METHOD /path match
  const meByPath = findOpenApiOperation(operations, "GET /v1/me");
  assert.ok(meByPath);
  assert.equal(meByPath.operationId, "users.me.get");

  // Normalized/alias match for users.profile.get
  const profileAlias = findOpenApiOperation(operations, "users.profile.get");
  assert.ok(profileAlias);
  assert.equal(profileAlias.operationId, "users.me.get");

  // Unknown operation
  const unknown = findOpenApiOperation(operations, "unknown.operation");
  assert.equal(unknown, null);
});

test("handles scenario 1: previewing server adapter with dry-run", () => {
  const result = runScaffoldData({
    feature: "users",
    operation: "users.profile.get",
    dryRun: true,
  });

  assert.equal(result.status, "passed");
  assert.ok(result.summary.includes("Dry run: would scaffold data"));

  const featureDetail = result.details.find((d) => d.name === "feature");
  assert.equal(featureDetail?.value, "users");

  const opDetail = result.details.find((d) => d.name === "operation");
  assert.equal(opDetail?.value, "users.me.get");
});

test("handles scenario 4: unknown operation diagnostic error", () => {
  const result = runScaffoldData({
    feature: "billing",
    operation: "non.existent.op",
  });

  assert.equal(result.status, "failed");
  assert.ok(result.summary.includes("not found"));

  const available = result.details.find(
    (d) => d.name === "available-operations",
  );
  assert.ok(available && typeof available.value === "string");
  assert.ok(available.value.includes("health.get"));

  const total = result.details.find((d) => d.name === "total-operations");
  assert.ok(total && Number(total.value) > 20);
});

test("handles listing operations with filter", () => {
  const allResult = runScaffoldData({ list: true });
  assert.equal(allResult.status, "passed");
  assert.ok(allResult.summary.includes("Found 32 OpenAPI operation(s)"));

  const filterResult = runScaffoldData({ list: true, filter: "profile" });
  assert.equal(filterResult.status, "passed");
  assert.ok(filterResult.details.length > 0);
  assert.ok(
    filterResult.details.some(
      (d) => typeof d.value === "string" && d.value.includes("profileImage"),
    ),
  );
});

test("handles scenario 2: scaffolding data adapter and collision preflight", () => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "frontendkit-scaffold-data-"),
  );

  try {
    const result = runScaffoldData(
      {
        feature: "order-tracking",
        operation: "users.me.get",
      },
      { root: tempDir },
    );

    assert.equal(result.status, "passed");

    const apiPath = path.join(
      tempDir,
      "src/features/order-tracking/server/order-tracking-api.ts",
    );
    const testPath = path.join(
      tempDir,
      "src/features/order-tracking/server/order-tracking-api.test.ts",
    );

    assert.ok(fs.existsSync(apiPath));
    assert.ok(fs.existsSync(testPath));

    const apiContent = fs.readFileSync(apiPath, "utf8");
    assert.ok(apiContent.includes('import "server-only";'));
    assert.ok(apiContent.includes("createConfiguredExampleApiClient"));
    assert.ok(apiContent.includes("usersMeGet("));
    assert.ok(apiContent.includes("accessToken: string"));
    assert.ok(apiContent.includes("Promise<ApiResult<UsersMeGetData>>"));

    const testContent = fs.readFileSync(testPath, "utf8");
    assert.ok(testContent.includes('describe("Order Tracking server API"'));
    assert.ok(testContent.includes("usersMeGet"));
    assert.ok(testContent.includes("expect(result).toMatchObject({"));

    // Collision preflight
    const collisionResult = runScaffoldData(
      {
        feature: "order-tracking",
        operation: "users.me.get",
      },
      { root: tempDir },
    );
    assert.equal(collisionResult.status, "failed");
    assert.ok(collisionResult.summary.includes("already exist"));

    // Force overwrite
    const forceResult = runScaffoldData(
      {
        feature: "order-tracking",
        operation: "users.me.get",
        force: true,
      },
      { root: tempDir },
    );
    assert.equal(forceResult.status, "passed");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("handles scenario 3: composite scaffold all creates feature skeleton and data adapter", () => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "frontendkit-scaffold-all-"),
  );

  try {
    // Dry-run preview
    const dryRunResult = runScaffoldAll(
      {
        feature: "invoicing",
        operation: "users.me.get",
        slice: "details",
        kind: "authenticated",
        dryRun: true,
      },
      { root: tempDir },
    );

    assert.equal(dryRunResult.status, "passed");
    assert.ok(dryRunResult.summary.includes("Dry run"));
    assert.ok(dryRunResult.details.some((d) => d.value === "invoicing"));

    // Write all
    const result = runScaffoldAll(
      {
        feature: "invoicing",
        operation: "users.me.get",
        slice: "details",
        kind: "authenticated",
      },
      { root: tempDir },
    );

    assert.equal(result.status, "passed");

    // Check feature skeleton files
    const pagePath = path.join(
      tempDir,
      "src/features/invoicing/details/details-page.tsx",
    );
    const actionPath = path.join(
      tempDir,
      "src/features/invoicing/details/details-action.ts",
    );
    const apiPath = path.join(
      tempDir,
      "src/features/invoicing/server/invoicing-api.ts",
    );
    const apiTestPath = path.join(
      tempDir,
      "src/features/invoicing/server/invoicing-api.test.ts",
    );

    assert.ok(fs.existsSync(pagePath));
    assert.ok(fs.existsSync(actionPath));
    assert.ok(fs.existsSync(apiPath));
    assert.ok(fs.existsSync(apiTestPath));

    // Verify Server Action links the server adapter
    const actionContent = fs.readFileSync(actionPath, "utf8");
    assert.ok(
      actionContent.includes(
        'import { usersMeGet } from "../server/invoicing-api";',
      ),
    );
    assert.ok(actionContent.includes("void usersMeGet;"));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
