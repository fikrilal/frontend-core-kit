#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
]);
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".next-e2e",
  "coverage",
  "node_modules",
  "playwright-report",
  "test-results",
]);

const processEnvAllowed = [
  "next.config.",
  "playwright.config.",
  "scripts/",
  "src/server/config/",
  // E2E fixtures may read SESSION_SECRET to seal cookies aligned with the app.
  "tests/",
];

const rawFetchAllowed = ["scripts/", "src/server/api/client.", "tests/"];

/** Soft cap so route files stay composition-only. */
const MAX_APP_PAGE_LINES = 50;

const violations = [];

for (const filePath of sourceFiles(root)) {
  const relativePath = toPosix(path.relative(root, filePath));
  const source = fs.readFileSync(filePath, "utf8");
  const searchable = stripLineComments(source);

  checkProcessEnv(relativePath, searchable);
  checkRawFetch(relativePath, searchable);
  checkImports(relativePath, source);
  checkThinAppPage(relativePath, source);
}

if (violations.length > 0) {
  console.error("Architecture check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Architecture check passed.");

function checkProcessEnv(relativePath, source) {
  if (!source.includes("process.env")) return;
  if (matchesAnyPrefix(relativePath, processEnvAllowed)) return;

  violations.push(
    `${relativePath} reads process.env. Read environment values through src/server/config/.`,
  );
}

function checkRawFetch(relativePath, source) {
  if (!/\bfetch\s*\(/.test(source)) return;
  if (matchesAnyPrefix(relativePath, rawFetchAllowed)) return;

  violations.push(
    `${relativePath} calls fetch directly. Put network access behind server adapters or generated contracts.`,
  );
}

function checkImports(relativePath, source) {
  const imports = importSpecifiers(source);

  if (relativePath.startsWith("src/components/ui/")) {
    for (const specifier of imports) {
      const target = resolveImport(relativePath, specifier);
      if (
        target &&
        matchesAnyPrefix(target, [
          "src/app/",
          "src/contracts/",
          "src/features/",
          "src/server/",
        ])
      ) {
        violations.push(
          `${relativePath} imports ${specifier}. UI primitives must not depend on app, features, server, or contracts.`,
        );
      }
    }
  }

  if (relativePath.startsWith("src/lib/")) {
    for (const specifier of imports) {
      const target = resolveImport(relativePath, specifier);
      if (
        target &&
        matchesAnyPrefix(target, ["src/app/", "src/features/", "src/server/"])
      ) {
        violations.push(
          `${relativePath} imports ${specifier}. Generic lib helpers must stay product- and server-agnostic.`,
        );
      }
    }
  }

  if (isClientComponent(source)) {
    for (const specifier of imports) {
      const target = resolveImport(relativePath, specifier);
      if (
        specifier === "server-only" ||
        (target && target.startsWith("src/server/"))
      ) {
        violations.push(
          `${relativePath} is a Client Component and imports ${specifier}. Client Components must not import server-only modules.`,
        );
      }
    }
  }

  for (const specifier of imports) {
    checkFeatureDeepImport(relativePath, specifier);
    checkRelativeFeatureCrossImport(relativePath, specifier);
  }
}

/**
 * Outside a feature, only import that feature's public API:
 *   @/features/<name>  or  @/features/<name>/index
 * Deep paths like @/features/marketing/MarketingPage are forbidden.
 * Inside a feature, deep imports of the same feature are allowed.
 */
function checkFeatureDeepImport(relativePath, specifier) {
  const match = specifier.match(/^@\/features\/([^/]+)(?:\/(.+))?$/);
  if (!match) return;

  const featureName = match[1];
  const rest = match[2];

  // Public API forms: @/features/foo or @/features/foo/index(...)
  if (!rest || rest === "index" || rest.startsWith("index.")) {
    return;
  }

  const sourceFeature = featureNameFromPath(relativePath);
  if (sourceFeature === featureName) {
    return;
  }

  violations.push(
    `${relativePath} deep-imports feature internals via "${specifier}". Import the feature public API (@/features/${featureName}) instead.`,
  );
}

/**
 * Relative imports must not resolve into another feature.
 * Cross-feature consumption goes through the `@/features/<name>` public API.
 */
function checkRelativeFeatureCrossImport(relativePath, specifier) {
  if (!specifier.startsWith(".")) return;

  const target = resolveImport(relativePath, specifier);
  if (!target) return;

  const targetFeature = featureNameFromPath(`${target}/`);
  if (!targetFeature) return;

  const sourceFeature = featureNameFromPath(relativePath);
  if (sourceFeature === targetFeature) return;

  violations.push(
    `${relativePath} imports ${specifier}, which resolves into another feature ("${targetFeature}"). Use the feature public API (@/features/${targetFeature}) instead.`,
  );
}

function checkThinAppPage(relativePath, source) {
  // Match src/app/page.tsx and src/app/**/page.tsx
  if (
    !relativePath.startsWith("src/app/") ||
    !/(^|\/)page\.(tsx|ts|jsx|js)$/.test(relativePath)
  ) {
    return;
  }

  const lineCount = source.split("\n").length;
  if (lineCount > MAX_APP_PAGE_LINES) {
    violations.push(
      `${relativePath} has ${lineCount} lines (max ${MAX_APP_PAGE_LINES}). Keep route files thin; move product UI into features.`,
    );
  }

  if (/\bfetch\s*\(/.test(source)) {
    violations.push(
      `${relativePath} calls fetch. Load data in feature server modules or server adapters, not route files.`,
    );
  }

  // Intrinsic HTML/product markup belongs in features, not routes.
  // Feature components are PascalCase (<MarketingPage />), so only flag lowercase tags.
  if (/<[a-z][\w-]*[\s/>]/.test(source)) {
    violations.push(
      `${relativePath} contains HTML/JSX element tags. Routes should compose feature components only.`,
    );
  }
}

function featureNameFromPath(relativePath) {
  const match = relativePath.match(/^src\/features\/([^/]+)\//);
  return match ? match[1] : null;
}

function* sourceFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* sourceFiles(absolutePath);
      continue;
    }

    if (!entry.isFile()) continue;
    if (sourceExtensions.has(path.extname(entry.name))) {
      yield absolutePath;
    }
  }
}

function importSpecifiers(source) {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:type\s+)?[^'"]*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }

  return specifiers;
}

function resolveImport(sourceRelativePath, specifier) {
  if (specifier.startsWith("@/")) {
    return `src/${specifier.slice(2)}`;
  }

  if (specifier.startsWith(".")) {
    const sourceDirectory = path.posix.dirname(sourceRelativePath);
    return toPosix(
      path.posix.normalize(path.posix.join(sourceDirectory, specifier)),
    );
  }

  return null;
}

function isClientComponent(source) {
  const trimmed = source.trimStart();
  return (
    trimmed.startsWith('"use client"') ||
    trimmed.startsWith("'use client'") ||
    trimmed.startsWith('"use client";') ||
    trimmed.startsWith("'use client';")
  );
}

function stripLineComments(source) {
  return source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
}

function matchesAnyPrefix(value, prefixes) {
  return prefixes.some((prefix) => value.startsWith(prefix));
}

function toPosix(value) {
  return value.replaceAll(path.sep, "/");
}
