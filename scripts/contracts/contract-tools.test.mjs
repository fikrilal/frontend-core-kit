import assert from "node:assert/strict";
import test from "node:test";

import {
  assertOpenApiSnapshot,
  hasContractDrift,
  parseSyncArguments,
  sha256,
} from "./contract-tools.mjs";

test("requires an explicit contract source", () => {
  assert.throws(() => parseSyncArguments([]), /Missing --source/);
  assert.throws(
    () => parseSyncArguments(["--source"]),
    /--source requires a file path/,
  );
});

test("accepts both supported source argument forms", () => {
  const expected = "/tmp/openapi.yaml";

  assert.deepEqual(parseSyncArguments(["--source", expected]), {
    sourcePath: expected,
  });
  assert.deepEqual(parseSyncArguments([`--source=${expected}`]), {
    sourcePath: expected,
  });
  assert.deepEqual(parseSyncArguments(["--", "--source", expected]), {
    sourcePath: expected,
  });
});

test("rejects duplicate and unknown arguments", () => {
  assert.throws(
    () =>
      parseSyncArguments([
        "--source",
        "/tmp/one.yaml",
        "--source=/tmp/two.yaml",
      ]),
    /only be provided once/,
  );
  assert.throws(() => parseSyncArguments(["--input", "openapi.yaml"]), {
    message: "Unknown argument: --input",
  });
});

test("validates the minimum OpenAPI snapshot boundary", () => {
  assert.doesNotThrow(() =>
    assertOpenApiSnapshot(Buffer.from("openapi: 3.0.0\npaths:\n")),
  );
  assert.throws(
    () => assertOpenApiSnapshot(Buffer.from("swagger: 2.0\npaths:\n")),
    /OpenAPI 3.x/,
  );
  assert.throws(
    () => assertOpenApiSnapshot(Buffer.from("openapi: 3.0.0\n")),
    /does not declare paths/,
  );
});

test("detects exact generated-contract drift", () => {
  assert.equal(
    hasContractDrift(Buffer.from("same"), Buffer.from("same")),
    false,
  );
  assert.equal(
    hasContractDrift(Buffer.from("before"), Buffer.from("after")),
    true,
  );
});

test("creates stable SHA-256 provenance", () => {
  assert.equal(
    sha256(Buffer.from("lamara")),
    "5f70c8bd1b5aaff91195aeab3a6b1d6ea041a22111e34179d82ef732850ff058",
  );
});
