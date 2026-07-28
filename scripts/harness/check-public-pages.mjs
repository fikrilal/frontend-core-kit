#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const marketingRoot = path.join(root, "src/app/(marketing)");
const siteMetadataFile = "src/app/site-metadata.ts";
const requiredMetadataRoutes = [
  "src/app/manifest.ts",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/opengraph-image.tsx",
  "src/app/twitter-image.tsx",
  "src/app/icon.svg",
];
const violations = [];

const routeFiles = fs.existsSync(marketingRoot)
  ? findPageFiles(marketingRoot)
  : [];
const discoveredRoutes = routeFiles.map(routeFromPageFile).toSorted();

if (discoveredRoutes.length === 0) {
  violations.push("No public pages exist under src/app/(marketing)/.");
}

for (const relativeFile of routeFiles) {
  const source = fs.readFileSync(path.join(root, relativeFile), "utf8");
  if (!/export\s+default\s+(?:async\s+)?function\s+\w+/.test(source)) {
    violations.push(
      `${relativeFile} must export a named default page function.`,
    );
  }
}

const siteMetadataPath = path.join(root, siteMetadataFile);
if (!fs.existsSync(siteMetadataPath)) {
  violations.push(`${siteMetadataFile} is missing.`);
} else {
  const declaredRoutes = extractPublicRoutePaths(
    fs.readFileSync(siteMetadataPath, "utf8"),
  ).toSorted();

  if (!sameValues(declaredRoutes, discoveredRoutes)) {
    violations.push(
      `${siteMetadataFile} publicRoutes (${declaredRoutes.join(", ")}) do not match marketing routes (${discoveredRoutes.join(", ")}).`,
    );
  }
}

for (const relativeFile of requiredMetadataRoutes) {
  if (!fs.existsSync(path.join(root, relativeFile))) {
    violations.push(`Required metadata route ${relativeFile} is missing.`);
  }
}

const sitemapFile = path.join(root, "src/app/sitemap.ts");
if (
  fs.existsSync(sitemapFile) &&
  !fs.readFileSync(sitemapFile, "utf8").includes("publicRoutes")
) {
  violations.push(
    "src/app/sitemap.ts must derive entries from publicRoutes instead of maintaining another route list.",
  );
}

if (violations.length > 0) {
  console.error("Public page check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(
  `Public page check passed (${discoveredRoutes.length} route${discoveredRoutes.length === 1 ? "" : "s"}).`,
);

function findPageFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findPageFiles(absolutePath));
    } else if (entry.isFile() && /^page\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(toPosix(path.relative(root, absolutePath)));
    }
  }
  return files;
}

function routeFromPageFile(relativeFile) {
  const withinGroup = relativeFile
    .replace(/^src\/app\/\(marketing\)/, "")
    .replace(/\/page\.(ts|tsx|js|jsx)$/, "");
  return withinGroup.length === 0 ? "/" : withinGroup;
}

function extractPublicRoutePaths(source) {
  const blockMatch = source.match(
    /export\s+const\s+publicRoutes\s*=\s*\[([\s\S]*?)\]\s*as\s+const/,
  );
  if (!blockMatch) {
    return [];
  }

  return Array.from(
    blockMatch[1].matchAll(/path\s*:\s*["']([^"']+)["']/g),
    (match) => match[1],
  );
}

function sameValues(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function toPosix(value) {
  return value.replaceAll(path.sep, "/");
}
