#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const publicPages = [
  {
    route: "/",
    file: "src/app/page.tsx",
    metadata: "inherited",
  },
];

const siteMetadataFile = "src/app/site-metadata.ts";
const violations = [];

for (const page of publicPages) {
  const absolutePath = path.join(root, page.file);
  if (!fs.existsSync(absolutePath)) {
    violations.push(`${page.route} is missing route file ${page.file}.`);
    continue;
  }

  const source = fs.readFileSync(absolutePath, "utf8");

  if (!/export\s+default\s+(?:async\s+)?function\s+\w+/.test(source)) {
    violations.push(`${page.file} must export a default page component.`);
  }

  if (page.metadata === "required") {
    if (!/export\s+const\s+metadata\s*:/.test(source)) {
      violations.push(`${page.file} must export route-level metadata.`);
    } else {
      if (!/\btitle\s*:/.test(source)) {
        violations.push(`${page.file} metadata must include a title for SEO.`);
      }
      if (!/\bdescription\s*:/.test(source)) {
        violations.push(
          `${page.file} metadata must include a description for SEO.`,
        );
      }
    }
  }
}

const rootLayout = "src/app/layout.tsx";
const rootLayoutPath = path.join(root, rootLayout);
if (!fs.existsSync(rootLayoutPath)) {
  violations.push(`${rootLayout} is missing.`);
} else {
  const source = fs.readFileSync(rootLayoutPath, "utf8");
  if (!/export\s+const\s+metadata\s*:/.test(source)) {
    violations.push(`${rootLayout} must export root metadata.`);
  }
}

const siteMetadataPath = path.join(root, siteMetadataFile);
if (!fs.existsSync(siteMetadataPath)) {
  violations.push(`${siteMetadataFile} is missing.`);
} else {
  const siteSource = fs.readFileSync(siteMetadataPath, "utf8");
  const declaredPaths = extractPublicRoutePaths(siteSource);

  if (declaredPaths.length === 0) {
    violations.push(
      `${siteMetadataFile} must declare publicRoutes entries used by the sitemap.`,
    );
  }

  for (const page of publicPages) {
    if (!declaredPaths.includes(page.route)) {
      violations.push(
        `${page.route} is missing from publicRoutes in ${siteMetadataFile} (sitemap would omit it).`,
      );
    }
  }

  for (const declared of declaredPaths) {
    if (!publicPages.some((page) => page.route === declared)) {
      violations.push(
        `publicRoutes includes ${declared} but the public page harness does not list it. Keep them in sync.`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error("Public page check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Public page check passed.");

/**
 * Extract path strings from:
 *   export const publicRoutes = [ { path: "/", ... }, ... ]
 */
function extractPublicRoutePaths(source) {
  const blockMatch = source.match(
    /export\s+const\s+publicRoutes\s*=\s*\[([\s\S]*?)\]\s*as\s+const/,
  );
  if (!blockMatch) {
    return [];
  }

  const paths = [];
  for (const match of blockMatch[1].matchAll(/path\s*:\s*["']([^"']+)["']/g)) {
    paths.push(match[1]);
  }
  return paths;
}
