import assert from "node:assert/strict";
import test from "node:test";

import { parseCommand } from "./command.mjs";
import { runCli } from "./cli.mjs";
import { CliUsageError, passed, renderJson } from "./result.mjs";

test("parses help and a single global JSON option", () => {
  assert.deepEqual(parseCommand([]), { kind: "help", format: "human" });
  assert.deepEqual(parseCommand(["--", "help"]), {
    kind: "help",
    format: "human",
  });
  assert.deepEqual(parseCommand(["help", "--json"]), {
    kind: "help",
    format: "json",
  });
});

test("rejects unknown commands and malformed global options", () => {
  assert.throws(() => parseCommand(["unknown"]), CliUsageError);
  assert.throws(
    () => parseCommand(["help", "--json", "--json"]),
    CliUsageError,
  );
});

test("renders stable human and JSON help", () => {
  const human = capture([]);
  assert.equal(human.exitCode, 0);
  assert.match(human.stdout, /^Frontendkit repository harness\./);
  assert.match(human.stdout, /Usage: pnpm frontendkit/);
  assert.equal(human.stderr, "");

  const json = capture(["--json", "help"]);
  assert.equal(json.exitCode, 0);
  assert.equal(JSON.parse(json.stdout).command, "help");
  assert.equal(JSON.parse(json.stdout).status, "passed");
});

test("returns usage code without a stack trace", () => {
  const output = capture(["nope"]);
  assert.equal(output.exitCode, 2);
  assert.equal(output.stdout, "");
  assert.match(output.stderr, /Unknown frontendkit command/);
  assert.doesNotMatch(output.stderr, /\n\s+at /);
});

test("rejects unsafe or unbounded result fields", () => {
  assert.throws(() =>
    renderJson(
      passed({
        command: "help",
        summary: "ok",
        details: [{ name: "Not Safe", value: "value" }],
      }),
    ),
  );
});

function capture(args) {
  let stdout = "";
  let stderr = "";
  const exitCode = runCli({
    args,
    stdout: (value) => {
      stdout += value;
    },
    stderr: (value) => {
      stderr += value;
    },
  });
  return { exitCode, stdout, stderr };
}
