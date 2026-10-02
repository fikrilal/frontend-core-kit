import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const checkerPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "check-architecture.mjs",
);

function runChecker(root) {
  return spawnSync(process.execPath, [checkerPath], {
    cwd: root,
    encoding: "utf8",
  });
}

function writeFixture(root, relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

test("flags relative imports that resolve into another feature", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "arch-check-"));
  try {
    writeFixture(
      root,
      "src/features/alpha/index.ts",
      "export const value = 1;\n",
    );
    writeFixture(
      root,
      "src/features/beta/consumer.ts",
      'import { value } from "../alpha";\n\nexport const consumer = value;\n',
    );

    const result = runChecker(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /resolves into another feature \("alpha"\)/);
    assert.match(result.stderr, /consumer\.ts/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("allows relative imports within the same feature", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "arch-check-"));
  try {
    writeFixture(
      root,
      "src/features/beta/helper.ts",
      "export const helper = 1;\n",
    );
    writeFixture(
      root,
      "src/features/beta/consumer.ts",
      'import { helper } from "./helper";\n\nexport const consumer = helper;\n',
    );

    const result = runChecker(root);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Architecture check passed\./);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
