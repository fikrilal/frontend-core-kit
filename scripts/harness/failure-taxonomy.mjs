const descriptors = Object.freeze({
  "node-version": descriptor(
    "preflight",
    "harness-maintainer",
    false,
    "activate-node",
  ),
  "pnpm-version": descriptor(
    "preflight",
    "harness-maintainer",
    false,
    "activate-pnpm",
  ),
  "package-manager": descriptor(
    "preflight",
    "harness-maintainer",
    false,
    "declare-pnpm",
  ),
  "git-repository": descriptor(
    "preflight",
    "task-owner",
    false,
    "use-worktree-root",
  ),
  "git-revision": descriptor(
    "preflight",
    "task-owner",
    false,
    "resolve-revision",
  ),
  "git-status": descriptor("preflight", "task-owner", true, "repair-git-state"),
  "git-conflict": descriptor(
    "preflight",
    "task-owner",
    true,
    "resolve-conflicts",
  ),
  "git-changes": descriptor(
    "preflight",
    "task-owner",
    true,
    "repair-git-state",
  ),
  "browser-missing": descriptor(
    "preflight",
    "harness-maintainer",
    true,
    "install-chromium",
  ),
  knowledge: descriptor("knowledge", "plan-owner", true, "repair-knowledge"),
  "missing-active-plan": descriptor(
    "knowledge",
    "plan-owner",
    true,
    "activate-plan",
  ),
  "active-plan-count": descriptor(
    "knowledge",
    "plan-owner",
    true,
    "activate-one-plan",
  ),
  "invalid-active-plan": descriptor(
    "knowledge",
    "plan-owner",
    true,
    "repair-active-plan",
  ),
  "scope-violation": descriptor(
    "scope",
    "task-owner",
    false,
    "approve-boundary-change",
  ),
  "task-plan-changed": descriptor(
    "scope",
    "task-owner",
    false,
    "restart-task-baseline",
  ),
  "task-boundaries-changed": descriptor(
    "scope",
    "task-owner",
    false,
    "restart-task-baseline",
  ),
  "repair-budget-exhausted": descriptor(
    "scope",
    "human-supervisor",
    false,
    "request-direction",
  ),
  "lane-fast-failed": descriptor(
    "integration",
    "code-owner",
    true,
    "run-fast-lane",
  ),
  "lane-full-failed": descriptor(
    "integration",
    "code-owner",
    true,
    "run-full-lane",
  ),
  "lane-runtime-failed": descriptor(
    "runtime",
    "feature-ux-owner",
    true,
    "run-runtime-lane",
  ),
});

export function describeFailure(code) {
  return (
    descriptors[code] ??
    descriptor("integration", "harness-maintainer", false, "inspect-unexpected")
  );
}

function descriptor(family, owner, repairable, remediationId) {
  return Object.freeze({ family, owner, repairable, remediationId });
}
