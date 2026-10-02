// @ts-check

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { failed, passed } from "./result.mjs";
import { formatFilesWithPrettier, parseName } from "./scaffold.mjs";

const namePattern = /^[a-z][a-z0-9]*([_-][a-z0-9]+)*$/;
const protectedFeatures = new Set(["auth", "marketing", "users"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const routeGroups = ["(authenticated)", "(marketing)"];

/**
 * @typedef {object} RemoveFeatureOptions
 * @property {string} feature
 * @property {string} [slice]
 * @property {boolean} [dryRun]
 * @property {boolean} [forceCore]
 * @property {boolean} [yes]
 */

/**
 * Removes a feature (or a single slice) and unwires its route and metadata.
 *
 * @param {RemoveFeatureOptions} options
 * @param {{ root?: string }} [context]
 */
export function runRemoveFeature(
  { feature, slice, dryRun = false, forceCore = false, yes = false },
  { root = process.cwd() } = {},
) {
  // frontendkit commands are non-interactive; --yes is accepted for forward compatibility.
  void yes;

  if (!feature || !namePattern.test(feature)) {
    return failed({
      command: "remove:feature",
      summary: `Invalid feature name "${feature ?? ""}". Expected kebab-case or snake-case.`,
      details: [
        {
          name: "remediation",
          value:
            "Use kebab-case or snake-case, e.g. billing or order-tracking.",
        },
      ],
    });
  }

  const featureMeta = parseName(feature);

  if (protectedFeatures.has(featureMeta.kebab) && !forceCore) {
    return failed({
      command: "remove:feature",
      summary: `Refusing to remove protected core feature "${featureMeta.kebab}".`,
      details: [
        { name: "blocker-code", value: "core-feature-protected" },
        {
          name: "remediation",
          value:
            "Pass --force-core only when intentionally removing core infrastructure.",
        },
      ],
    });
  }

  const effectiveSlice =
    slice && slice.trim().length > 0 ? slice.trim() : undefined;
  if (effectiveSlice && !namePattern.test(effectiveSlice)) {
    return failed({
      command: "remove:feature",
      summary: `Invalid slice name "${effectiveSlice}". Expected kebab-case or snake-case.`,
      details: [
        {
          name: "remediation",
          value: "Use kebab-case or snake-case, e.g. details or invoice-list.",
        },
      ],
    });
  }

  const featureDir = path.join(root, "src/features", featureMeta.kebab);
  const routeDirs = routeGroups.map((group) =>
    path.join(root, "src/app", group, featureMeta.kebab),
  );

  if (effectiveSlice) {
    const sliceDir = path.join(featureDir, effectiveSlice);
    if (!fs.existsSync(sliceDir)) {
      return failed({
        command: "remove:feature",
        summary: `Slice "${effectiveSlice}" was not found in feature "${featureMeta.kebab}".`,
        details: [
          {
            name: "expected-path",
            value: toPosix(path.relative(root, sliceDir)),
          },
          {
            name: "remediation",
            value: "Check the slice name or remove the whole feature.",
          },
        ],
      });
    }
  } else if (!fs.existsSync(featureDir)) {
    return failed({
      command: "remove:feature",
      summary: `Feature "${featureMeta.kebab}" was not found.`,
      details: [
        {
          name: "expected-path",
          value: toPosix(path.relative(root, featureDir)),
        },
        {
          name: "remediation",
          value: "Only features under src/features can be removed.",
        },
      ],
    });
  }

  const ownedDirs = effectiveSlice
    ? [
        path.join(featureDir, effectiveSlice),
        ...routeDirs.map((dir) => path.join(dir, effectiveSlice)),
      ]
    : [featureDir, ...routeDirs];
  const deletions = ownedDirs.filter((candidate) => fs.existsSync(candidate));

  if (!effectiveSlice) {
    const references = findExternalReferences(
      root,
      featureMeta.kebab,
      ownedDirs,
    );
    if (references.length > 0) {
      return failed({
        command: "remove:feature",
        summary: `Refusing to remove "${featureMeta.kebab}": ${references.length} external reference(s) found.`,
        details: [
          ...references.slice(0, 8).map((reference, index) => ({
            name: `referencing-file-${index + 1}`,
            value: reference,
          })),
          { name: "total-references", value: references.length },
          {
            name: "remediation",
            value: "Remove the @/features imports first, then retry.",
          },
        ],
      });
    }
  }

  const siteMetadataPath = path.join(root, "src/app/site-metadata.ts");
  const metadataPlan = planMetadataPrune(
    siteMetadataPath,
    featureMeta.kebab,
    effectiveSlice,
  );
  const indexPath = path.join(featureDir, "index.ts");
  const indexPlan = effectiveSlice
    ? planSliceExportPrune(indexPath, effectiveSlice)
    : null;

  const fileCount = deletions.reduce(
    (total, directory) => total + countFiles(directory),
    0,
  );

  if (dryRun) {
    return passed({
      command: "remove:feature",
      summary: `Dry run: would remove feature "${featureMeta.kebab}"${
        effectiveSlice ? ` slice "${effectiveSlice}"` : ""
      }.`,
      details: [
        { name: "feature", value: featureMeta.kebab },
        ...(effectiveSlice ? [{ name: "slice", value: effectiveSlice }] : []),
        { name: "removed-paths", value: deletions.length },
        { name: "file-count", value: fileCount },
        { name: "metadata-pruned", value: metadataPlan.prunedCount },
        { name: "index-updated", value: indexPlan?.pruned ?? false },
        ...deletions.slice(0, 10).map((directory, index) => ({
          name: `would-remove-${index + 1}`,
          value: toPosix(path.relative(root, directory)),
        })),
      ],
    });
  }

  for (const directory of deletions) {
    fs.rmSync(directory, { recursive: true, force: true });
  }

  let metadataPruned = 0;
  if (metadataPlan.content !== null) {
    fs.writeFileSync(siteMetadataPath, metadataPlan.content, "utf8");
    formatFilesWithPrettier([siteMetadataPath], root);
    metadataPruned = metadataPlan.prunedCount;
  }

  if (indexPlan && indexPlan.content !== null) {
    fs.writeFileSync(indexPath, indexPlan.content, "utf8");
    formatFilesWithPrettier([indexPath], root);
  }

  return passed({
    command: "remove:feature",
    summary: `Feature "${featureMeta.kebab}"${
      effectiveSlice ? ` slice "${effectiveSlice}"` : ""
    } removed successfully.`,
    details: [
      { name: "feature", value: featureMeta.kebab },
      ...(effectiveSlice ? [{ name: "slice", value: effectiveSlice }] : []),
      { name: "removed-paths", value: deletions.length },
      { name: "file-count", value: fileCount },
      { name: "metadata-pruned", value: metadataPruned },
      { name: "index-updated", value: indexPlan?.pruned ?? false },
      {
        name: "remediation",
        value: "Run pnpm verify:fast to verify the repository state.",
      },
    ],
  });
}

/**
 * Collects source files that import the feature outside its owned directories.
 *
 * @param {string} root
 * @param {string} feature
 * @param {string[]} excludedDirs
 * @returns {string[]}
 */
function findExternalReferences(root, feature, excludedDirs) {
  const srcRoot = path.join(root, "src");
  if (!fs.existsSync(srcRoot)) return [];

  const excluded = excludedDirs.map((directory) => path.resolve(directory));
  const specifierPattern = new RegExp(
    `["']@/features/${feature}(?:/[^"']*)?["']`,
  );
  /** @type {string[]} */
  const references = [];

  /** @param {string} directory */
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        walk(fullPath);
        continue;
      }
      if (!entry.isFile() || !sourceExtensions.has(path.extname(entry.name))) {
        continue;
      }

      const resolved = path.resolve(fullPath);
      if (
        excluded.some(
          (directoryPath) =>
            resolved === directoryPath ||
            resolved.startsWith(`${directoryPath}${path.sep}`),
        )
      ) {
        continue;
      }

      const source = fs.readFileSync(fullPath, "utf8");
      if (specifierPattern.test(source)) {
        references.push(toPosix(path.relative(root, fullPath)));
      }
    }
  }

  walk(srcRoot);
  return references.toSorted();
}

/**
 * Plans removal of publicRoutes entries for the feature or slice route.
 *
 * @param {string} siteMetadataPath
 * @param {string} feature
 * @param {string | undefined} slice
 * @returns {{ content: string | null, prunedCount: number }}
 */
function planMetadataPrune(siteMetadataPath, feature, slice) {
  if (!fs.existsSync(siteMetadataPath)) {
    return { content: null, prunedCount: 0 };
  }

  const content = fs.readFileSync(siteMetadataPath, "utf8");
  const pathPattern = slice
    ? new RegExp(`^/${feature}/${slice}$`)
    : new RegExp(`^/${feature}(?:/.*)?$`);

  let updated = content;
  let prunedCount = 0;
  for (const match of content.matchAll(/path:\s*"([^"]+)"/g)) {
    const routePath = match[1];
    if (!pathPattern.test(routePath)) continue;

    const escaped = escapeRegex(routePath);
    const entryPattern = new RegExp(
      `\\n  \\{[^}]*path: "${escaped}"[^}]*\\},?`,
      "g",
    );
    const next = updated.replace(entryPattern, "");
    if (next !== updated) {
      updated = next;
      prunedCount += 1;
    }
  }

  return prunedCount > 0
    ? { content: updated, prunedCount }
    : { content: null, prunedCount: 0 };
}

/**
 * Plans removal of a slice export from the feature public index.
 *
 * @param {string} indexPath
 * @param {string} slice
 * @returns {{ content: string | null, pruned: boolean }}
 */
function planSliceExportPrune(indexPath, slice) {
  if (!fs.existsSync(indexPath)) {
    return { content: null, pruned: false };
  }

  const content = fs.readFileSync(indexPath, "utf8");
  const escaped = escapeRegex(slice);
  const pattern = new RegExp(
    `^export \\{[^}]*\\} from "\\./${escaped}/[^"]*";\\n`,
    "gm",
  );
  const updated = content.replace(pattern, "");

  return updated !== content
    ? { content: updated, pruned: true }
    : { content: null, pruned: false };
}

/** @param {string} directory */
function countFiles(directory) {
  let count = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath);
    } else if (entry.isFile()) {
      count += 1;
    }
  }
  return count;
}

/** @param {string} value */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** @param {string} value */
function toPosix(value) {
  return value.replaceAll(path.sep, "/");
}
