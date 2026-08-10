import { spawnSync } from "node:child_process";

import { assertActionAllowed } from "./task-boundaries.mjs";
import { markTaskHandedOff, readTaskState } from "./task-state.mjs";
import {
  discoverTaskChanges,
  loadActivePlan,
  runTaskVerification,
  TaskVerificationFailure,
} from "./task-verification.mjs";

const branchPattern = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export function parseTaskHandoffArguments(args) {
  const options = {
    base: "main",
    head: null,
    title: null,
    pullRequest: null,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--") continue;
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (!["--base", "--head", "--title", "--pr"].includes(argument)) {
      throw handoffError(
        "invalid-arguments",
        "Task handoff arguments are invalid.",
        'Use "--base <branch>", optional "--head <branch>", "--title <text>", optional "--pr <number>", and optional "--dry-run".',
      );
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw handoffError(
        "invalid-arguments",
        `Task handoff requires a value for ${argument}.`,
        `Provide a value after ${argument}.`,
      );
    }
    if (argument === "--base") options.base = value;
    if (argument === "--head") options.head = value;
    if (argument === "--title") options.title = value;
    if (argument === "--pr") options.pullRequest = value;
    index += 1;
  }

  validateArguments(options);
  return options;
}

export function runTaskHandoff({
  root,
  base = "main",
  head = null,
  title,
  pullRequest = null,
  dryRun = false,
  execute = executeCommand,
  verifyTask = runTaskVerification,
  discoverChanges = discoverTaskChanges,
  readState = readTaskState,
  loadPlan = loadActivePlan,
  finishHandoff = markTaskHandedOff,
}) {
  try {
    validateArguments({ base, head, title, pullRequest, dryRun });
    const activePlan = loadPlan(root);
    const requiredActions = pullRequest
      ? ["commit", "push", "update-pr"]
      : ["commit", "push", "draft-pr"];
    for (const action of requiredActions) {
      assertActionAllowed(activePlan.boundaries, action);
    }

    const verification = verifyTask({ root, recordState: !dryRun });
    assertFreshSuccessfulVerification(verification, activePlan.path);
    const changes = discoverChanges({ root, base: "HEAD" });
    const state = readState(root);
    assertReadyCandidate({ state, verification });
    const taskPaths = assertOwnedTaskChanges({ changes, state, verification });
    const branch = resolveBranch({ root, head, execute });
    assertRemote({ root, execute });
    if (pullRequest) {
      assertExistingDraft({ root, execute, pullRequest, base, branch });
    }
    const body = renderPullRequestBody({ activePlan, verification, base });

    if (dryRun) {
      return {
        status: "ready",
        dryRun: true,
        base,
        head: branch,
        pullRequest,
        taskPaths,
        title,
        body,
      };
    }

    runCommand({
      root,
      execute,
      command: "git",
      args: ["add", "--", ...taskPaths],
    });
    runCommand({
      root,
      execute,
      command: "git",
      args: ["diff", "--cached", "--quiet"],
      acceptedStatuses: [1],
    });
    runCommand({
      root,
      execute,
      command: "git",
      args: ["commit", "-m", title],
    });
    runCommand({
      root,
      execute,
      command: "git",
      args: ["push", "origin", branch],
    });
    if (pullRequest) {
      runCommand({
        root,
        execute,
        command: "gh",
        args: ["pr", "edit", pullRequest, "--body", body],
      });
    } else {
      runCommand({
        root,
        execute,
        command: "gh",
        args: [
          "pr",
          "create",
          "--draft",
          "--base",
          base,
          "--head",
          branch,
          "--title",
          title,
          "--body",
          body,
        ],
      });
    }

    finishHandoff({ root, state });

    return {
      status: "published",
      dryRun: false,
      base,
      head: branch,
      pullRequest,
      taskPaths,
      title,
      body,
    };
  } catch (error) {
    if (error instanceof TaskHandoffFailure) throw error;
    if (error instanceof TaskVerificationFailure || error?.failure) {
      throw new TaskHandoffFailure(error.failure);
    }
    throw handoffError(
      "unexpected",
      "Task handoff encountered an unexpected local failure.",
      "Inspect the local handoff adapter and rerun its deterministic tests.",
    );
  }
}

function assertReadyCandidate({ state, verification }) {
  if (
    state.lifecycle !== "ready_for_review" ||
    typeof state.candidateFingerprint !== "string" ||
    state.candidateFingerprint !== verification.scope?.taskFingerprint ||
    !Array.isArray(state.candidatePaths) ||
    !Array.isArray(verification.scope?.taskPaths) ||
    JSON.stringify([...state.candidatePaths].toSorted()) !==
      JSON.stringify([...verification.scope.taskPaths].toSorted())
  ) {
    throw handoffError(
      "handoff-candidate-stale",
      "Task lifecycle readiness does not match the freshly verified candidate.",
      "Rerun task verification for the exact current candidate before handoff.",
    );
  }
}

function renderPullRequestBody({ activePlan, verification, base }) {
  const objective = sanitizeText(
    sectionContent(activePlan.source, "Objective"),
    280,
  );
  const rollback = sanitizeText(
    sectionContent(activePlan.source, "Rollout And Rollback"),
    400,
  );
  const followUp = sanitizeText(
    sectionContent(activePlan.source, "Follow-Up Debt"),
    400,
  );
  const commands = verification.lanes
    .filter((lane) => lane.status === "passed")
    .map((lane) => `- \`${lane.command}\``)
    .join("\n");

  return [
    "## Task handoff",
    "",
    `**Risk:** ${verification.risk.risk}`,
    `**Target branch:** ${base}`,
    "",
    "### Objective",
    objective || "See the approved execution plan.",
    "",
    "### Verification",
    commands || "No verification commands were recorded.",
    "",
    "### Runtime evidence",
    verification.lanes.some((lane) => lane.id === "runtime")
      ? "Browser runtime verification passed."
      : "Runtime verification was not required for this low-risk task.",
    "",
    "### Rollback",
    rollback || "Revert the task commit and reassess the approved plan.",
    "",
    "### Remaining human gates",
    followUp ||
      "Review the draft PR, CI results, and risk before merge or deployment.",
  ].join("\n");
}

function validateArguments({ base, head, title, pullRequest }) {
  for (const branch of [base, head].filter(Boolean)) {
    if (!branchPattern.test(branch) || branch.includes("..")) {
      throw handoffError(
        "invalid-branch",
        "Task handoff received an invalid branch name.",
        "Use a repository branch name without spaces, traversal, or Git revision syntax.",
      );
    }
  }
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 120 ||
    /[\r\n\0]/.test(title)
  ) {
    throw handoffError(
      "invalid-title",
      "Task handoff requires a short single-line commit and pull-request title.",
      "Provide --title with 1 to 120 printable characters.",
    );
  }
  if (pullRequest !== null && !/^[1-9]\d*$/.test(pullRequest)) {
    throw handoffError(
      "invalid-pull-request",
      "Task handoff received an invalid pull-request number.",
      "Provide --pr with a positive numeric pull-request identifier.",
    );
  }
}

function assertFreshSuccessfulVerification(verification, activePlanPath) {
  if (
    !verification ||
    verification.status !== "passed" ||
    verification.activePlan !== activePlanPath ||
    !verification.risk ||
    !Array.isArray(verification.lanes) ||
    verification.lanes.length === 0 ||
    verification.lanes.some((lane) => lane.status !== "passed")
  ) {
    throw handoffError(
      "verification-required",
      "Task handoff requires a fresh successful task verification for the active plan.",
      "Run pnpm task:verify, repair every required lane, then retry handoff.",
    );
  }
}

function assertOwnedTaskChanges({ changes, state, verification }) {
  if (state.preexistingChanges.changedPaths.length > 0) {
    throw handoffError(
      "unowned-changes",
      "Task handoff cannot publish from a baseline that already contained user changes.",
      "Use a clean worktree for a publishable task or ask the owner to separate the changes.",
    );
  }
  if (changes.committed.length > 0) {
    throw handoffError(
      "committed-task-changes",
      "Task handoff only creates a new commit from the verified working-tree task changes.",
      "Use a new task baseline or request a separately reviewed publication path for existing commits.",
    );
  }
  const taskPaths = changes.changedPaths;
  if (taskPaths.length === 0) {
    throw handoffError(
      "no-task-changes",
      "Task handoff found no verified working-tree changes to commit.",
      "Make and verify the approved task changes before requesting draft handoff.",
    );
  }
  if (
    !Array.isArray(verification.scope?.taskPaths) ||
    JSON.stringify(verification.scope.taskPaths.toSorted()) !==
      JSON.stringify(taskPaths.toSorted())
  ) {
    throw handoffError(
      "verification-stale",
      "Working-tree changes no longer match the freshly verified task scope.",
      "Rerun task verification after resolving the change set, then retry handoff.",
    );
  }
  return taskPaths;
}

function resolveBranch({ root, head, execute }) {
  const result = commandResult({
    root,
    execute,
    command: "git",
    args: ["branch", "--show-current"],
  });
  if (result.status !== 0 || !result.stdout.trim()) {
    throw handoffError(
      "branch-required",
      "Task handoff requires a checked-out named branch.",
      "Create or check out the approved task branch before requesting publication.",
    );
  }
  const branch = result.stdout.trim();
  if (head && head !== branch) {
    throw handoffError(
      "head-mismatch",
      "The requested PR head does not match the checked-out task branch.",
      "Use the current task branch or explicitly check out the approved head branch.",
    );
  }
  return branch;
}

function assertRemote({ root, execute }) {
  const result = commandResult({
    root,
    execute,
    command: "git",
    args: ["remote", "get-url", "origin"],
  });
  if (result.status !== 0 || !result.stdout.trim()) {
    throw handoffError(
      "origin-required",
      "Task handoff requires an explicit origin remote.",
      "Configure and review the origin remote before requesting publication.",
    );
  }
}

function assertExistingDraft({ root, execute, pullRequest, base, branch }) {
  const result = commandResult({
    root,
    execute,
    command: "gh",
    args: [
      "pr",
      "view",
      pullRequest,
      "--json",
      "state,isDraft,headRefName,baseRefName",
    ],
  });
  if (result.status !== 0) {
    throw handoffError(
      "pull-request-unavailable",
      "Task handoff could not inspect the requested pull request.",
      "Confirm GitHub access and the pull-request number before requesting repair handoff.",
    );
  }
  try {
    const pullRequestState = JSON.parse(result.stdout);
    if (
      pullRequestState.state !== "OPEN" ||
      pullRequestState.isDraft !== true ||
      pullRequestState.headRefName !== branch ||
      pullRequestState.baseRefName !== base
    ) {
      throw new Error("mismatch");
    }
  } catch {
    throw handoffError(
      "pull-request-mismatch",
      "Task handoff only repairs the matching open draft pull request.",
      "Use the approved draft PR and its exact base and head branches, or request human direction.",
    );
  }
}

function runCommand({ root, execute, command, args, acceptedStatuses = [0] }) {
  const result = commandResult({ root, execute, command, args });
  if (!acceptedStatuses.includes(result.status)) {
    if (command === "gh" || (command === "git" && args[0] === "push")) {
      throw handoffError(
        "publication-outcome-uncertain",
        "The external publication outcome could not be proven.",
        "Do not retry automatically; inspect the remote state and request human direction.",
      );
    }
    throw handoffError(
      "publication-command-failed",
      "A Git or GitHub publication command failed.",
      "Inspect the local command result, preserve history, and request human direction before retrying.",
    );
  }
  return result;
}

function commandResult({ root, execute, command, args }) {
  return execute(command, args, { cwd: root });
}

function sectionContent(source, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(
    new RegExp(`^## ${escapedHeading}\\n\\n([\\s\\S]*?)(?=^## |$)`, "m"),
  );
  return match?.[1]?.trim() ?? "";
}

function sanitizeText(value, maximumLength) {
  return value
    .replace(/```[\s\S]*?```/g, "[redacted code block]")
    .replace(
      /(?:[A-Z][A-Z0-9_]{2,}|token|secret|password|cookie)\s*[:=]\s*\S+/gi,
      "[redacted]",
    )
    .replace(/https?:\/\/[^\s]*@/gi, "https://[redacted]@")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function executeCommand(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    stdio: "pipe",
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? "" };
}

function handoffError(code, invariant, remediation) {
  return new TaskHandoffFailure({ code, invariant, remediation });
}

export class TaskHandoffFailure extends Error {
  constructor(failure) {
    super(failure.invariant);
    this.failure = failure;
  }
}
