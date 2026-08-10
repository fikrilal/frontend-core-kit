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

test("parses canonical verification profiles", () => {
  assert.deepEqual(parseCommand(["verify", "--profile", "fast"]), {
    kind: "verify",
    format: "human",
    profile: "fast",
  });
  assert.deepEqual(parseCommand(["--json", "verify", "--profile", "runtime"]), {
    kind: "verify",
    format: "json",
    profile: "runtime",
  });
});

test("parses read-only controls through one router", () => {
  assert.deepEqual(parseCommand(["doctor"]), {
    kind: "doctor",
    format: "human",
  });
  assert.deepEqual(parseCommand(["knowledge", "check"]), {
    kind: "owned",
    format: "human",
    owner: "knowledge",
    args: [],
  });
  assert.deepEqual(parseCommand(["contracts", "check", "--json"]), {
    kind: "owned",
    format: "json",
    owner: "contracts",
    args: [],
  });
  assert.deepEqual(
    parseCommand([
      "risk",
      "classify",
      "--",
      "--base",
      "HEAD^",
      "--head",
      "HEAD",
    ]),
    {
      kind: "owned",
      format: "human",
      owner: "risk",
      args: ["--base", "HEAD^", "--head", "HEAD"],
    },
  );
  assert.equal(parseCommand(["evidence", "report"]).owner, "evidence");
});

test("parses bounded task lifecycle commands", () => {
  assert.deepEqual(parseCommand(["task", "begin", "--base", "HEAD"]), {
    kind: "owned",
    format: "human",
    owner: "task-begin",
    args: ["--base", "HEAD"],
  });
  assert.deepEqual(
    parseCommand(["task", "verify", "--summary", "test-results/summary.json"]),
    {
      kind: "owned",
      format: "human",
      owner: "task-verify",
      args: ["--summary", "test-results/summary.json"],
    },
  );
  for (const command of ["status", "complete", "recover"]) {
    assert.equal(parseCommand(["task", command]).owner, `task-${command}`);
  }
  assert.throws(
    () => parseCommand(["task", "recover", "--base", "HEAD"]),
    CliUsageError,
  );
});

test("rejects unknown commands and malformed global options", () => {
  assert.throws(() => parseCommand(["unknown"]), CliUsageError);
  assert.throws(
    () => parseCommand(["help", "--json", "--json"]),
    CliUsageError,
  );
  assert.throws(
    () => parseCommand(["verify", "--profile", "unknown"]),
    CliUsageError,
  );
  assert.throws(() => parseCommand(["verify"]), CliUsageError);
  assert.throws(() => parseCommand(["doctor", "fix"]), CliUsageError);
  assert.throws(
    () => parseCommand(["risk", "classify", "--base", "HEAD"]),
    CliUsageError,
  );
});

test("renders stable human and JSON help", () => {
  const human = capture([]);
  assert.equal(human.exitCode, 0);
  assert.match(human.stdout, /^Frontendkit repository harness\./);
  assert.match(human.stdout, /Usage: pnpm frontendkit/);
  assert.match(human.stdout, /verify --profile/);
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
