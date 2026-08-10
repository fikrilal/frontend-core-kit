import assert from "node:assert/strict";
import test from "node:test";

import { createProcessRunner } from "./process-runner.mjs";

test("spawns commands directly without a shell", () => {
  const calls = [];
  const run = createProcessRunner({
    spawn: (command, args, options) => {
      calls.push({ command, args, options });
      return { status: 0, signal: null, stdout: "ok\n", stderr: "" };
    },
    now: times(100, 125),
  });

  const result = run("node", ["-e", "process.stdout.write('safe')"], {
    cwd: "/fixture",
  });

  assert.equal(result.durationMs, 25);
  assert.equal(result.stdout, "ok\n");
  assert.equal(calls[0].options.shell, false);
  assert.deepEqual(calls[0].args, ["-e", "process.stdout.write('safe')"]);
});

test("bounds captured output and never returns environment values", () => {
  const run = createProcessRunner({
    spawn: () => ({
      status: 1,
      signal: null,
      stdout: "a".repeat(100),
      stderr: "b".repeat(100),
    }),
  });
  const result = run("tool", [], {
    cwd: "/fixture",
    env: { PRIVATE_VALUE: "do-not-return" },
    maximumOutputBytes: 32,
  });

  assert.equal(result.outputTruncated, true);
  assert.doesNotMatch(JSON.stringify(result), /do-not-return/);
});

test("rejects invalid limits before spawning", () => {
  const run = createProcessRunner({
    spawn: () => assert.fail("must not spawn"),
  });
  assert.throws(() => run("tool", [], { cwd: "/fixture", timeoutMs: 0 }));
});

function times(...values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}
