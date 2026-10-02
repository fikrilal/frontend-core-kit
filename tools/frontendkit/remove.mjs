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

  const indexPath = path.join(featureDir, "index.ts");
  const sliceDir = effectiveSlice
    ? path.join(featureDir, effectiveSlice)
    : undefined;
  const sliceSymbols = effectiveSlice
    ? readSliceExports(indexPath, effectiveSlice)
    : [];
  const scanExclusions = effectiveSlice ? [...ownedDirs, indexPath] : ownedDirs;
  const references = findExternalReferences(
    {
      root,
      feature: featureMeta.kebab,
      featureDir,
      slice: effectiveSlice,
      sliceDir,
      sliceSymbols,
    },
    scanExclusions,
  );
  const blockingReferences = effectiveSlice
    ? references.filter((reference) => reference.kind === "slice")
    : references;
  if (blockingReferences.length > 0) {
    return failed({
      command: "remove:feature",
      summary: `Refusing to remove "${featureMeta.kebab}"${
        effectiveSlice ? ` slice "${effectiveSlice}"` : ""
      }: ${blockingReferences.length} external reference(s) found.`,
      details: [
        ...blockingReferences.slice(0, 8).map((reference, index) => ({
          name: `referencing-file-${index + 1}`,
          value:
            reference.symbols.length > 0
              ? `${reference.path} (${reference.symbols.join(", ")})`
              : reference.path,
        })),
        { name: "total-references", value: blockingReferences.length },
        {
          name: "remediation",
          value: effectiveSlice
            ? "Update the referencing modules to stop using the removed slice, then retry."
            : "Remove the @/features imports first, then retry.",
        },
      ],
    });
  }

  const siteMetadataPath = path.join(root, "src/app/site-metadata.ts");
  const metadataPlan = planMetadataPrune(
    siteMetadataPath,
    featureMeta.kebab,
    effectiveSlice,
  );
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
 * @typedef {object} ExternalReference
 * @property {string} path
 * @property {"slice" | "feature"} kind
 * @property {string[]} symbols
 */

/**
 * Collects external references to a feature, or to one of its slices.
 *
 * Whole-feature scans treat any alias or relative import that resolves into
 * the feature as a reference. Slice scans block direct slice references and
 * barrel imports that consume symbols the slice exports.
 *
 * @param {{
 *   root: string,
 *   feature: string,
 *   featureDir: string,
 *   slice?: string,
 *   sliceDir?: string,
 *   sliceSymbols?: string[],
 * }} input
 * @param {string[]} excludedDirs
 * @returns {ExternalReference[]}
 */
function findExternalReferences(
  { root, feature, featureDir, slice, sliceDir, sliceSymbols = [] },
  excludedDirs,
) {
  const srcRoot = path.join(root, "src");
  if (!fs.existsSync(srcRoot)) return [];

  const excluded = excludedDirs.map((directory) => path.resolve(directory));
  const featureDirResolved = path.resolve(featureDir);
  const sliceDirResolved = sliceDir ? path.resolve(sliceDir) : null;
  const aliasRoot = `@/features/${feature}`;
  const sliceExported = sliceSymbols.length > 0;
  /** @type {Map<string, { kind: "slice" | "feature", symbols: Set<string> }>} */
  const references = new Map();

  /**
   * @param {string} filePath
   * @param {"slice" | "feature"} kind
   * @param {string[]} symbols
   */
  function record(filePath, kind, symbols) {
    const existing = references.get(filePath);
    if (!existing) {
      references.set(filePath, { kind, symbols: new Set(symbols) });
      return;
    }
    if (kind === "slice") existing.kind = "slice";
    for (const symbol of symbols) existing.symbols.add(symbol);
  }

  /**
   * @param {string} source
   * @param {string} specifier
   * @returns {{ kind: "slice" | "feature", symbols: string[] } | null}
   */
  function matchBarrelSymbols(source, specifier) {
    const { symbols, namespace } = readImportedSymbols(source, specifier);
    const matched = symbols.filter((symbol) => sliceSymbols.includes(symbol));
    if (matched.length > 0) return { kind: "slice", symbols: matched };
    if (namespace && sliceExported) return { kind: "slice", symbols: [] };
    return null;
  }

  /**
   * @param {string} source
   * @param {string} fromDirectory
   * @param {string} specifier
   * @returns {{ kind: "slice" | "feature", symbols: string[] } | null}
   */
  function classifySpecifier(source, fromDirectory, specifier) {
    if (specifier === aliasRoot || specifier === `${aliasRoot}/index`) {
      if (!sliceDirResolved) return { kind: "feature", symbols: [] };
      return matchBarrelSymbols(source, specifier);
    }

    if (specifier.startsWith(`${aliasRoot}/`)) {
      if (!sliceDirResolved) return { kind: "feature", symbols: [] };
      const rest = specifier.slice(aliasRoot.length + 1);
      if (slice && (rest === slice || rest.startsWith(`${slice}/`))) {
        return { kind: "slice", symbols: [] };
      }
      return null;
    }

    if (!specifier.startsWith(".")) return null;

    const resolved = path.resolve(fromDirectory, specifier);
    const insideFeature =
      resolved === featureDirResolved ||
      resolved.startsWith(`${featureDirResolved}${path.sep}`);
    if (!insideFeature) return null;
    if (!sliceDirResolved) return { kind: "feature", symbols: [] };

    const insideSlice =
      resolved === sliceDirResolved ||
      resolved.startsWith(`${sliceDirResolved}${path.sep}`);
    if (insideSlice) return { kind: "slice", symbols: [] };

    if (resolved === featureDirResolved) {
      return matchBarrelSymbols(source, specifier);
    }

    return null;
  }

  /**
   * @param {string} source
   * @param {string} fromDirectory
   * @returns {{ kind: "slice" | "feature", symbols: string[] } | null}
   */
  function classify(source, fromDirectory) {
    for (const specifier of importSpecifiers(source)) {
      const match = classifySpecifier(source, fromDirectory, specifier);
      if (match) return match;
    }
    return null;
  }

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
      const match = classify(source, path.dirname(fullPath));
      if (match) record(fullPath, match.kind, match.symbols);
    }
  }

  walk(srcRoot);

  return [...references.entries()]
    .map(([filePath, reference]) => ({
      path: toPosix(path.relative(root, filePath)),
      kind: reference.kind,
      symbols: [...reference.symbols].toSorted(),
    }))
    .toSorted((left, right) => left.path.localeCompare(right.path));
}

/**
 * @param {string} indexPath
 * @param {string} slice
 * @returns {string[]}
 */
function readSliceExports(indexPath, slice) {
  if (!fs.existsSync(indexPath)) return [];

  const content = fs.readFileSync(indexPath, "utf8");
  const pattern = new RegExp(
    `export \\{([^}]*)\\} from "\\./${escapeRegex(slice)}/[^"]*";`,
    "g",
  );
  /** @type {string[]} */
  const symbols = [];
  for (const match of content.matchAll(pattern)) {
    for (const part of match[1].split(",")) {
      const symbol = extractSymbolName(part);
      if (symbol) symbols.push(symbol);
    }
  }
  return symbols;
}

/**
 * @param {string} source
 * @param {string} specifier
 * @returns {{ symbols: string[], namespace: boolean }}
 */
function readImportedSymbols(source, specifier) {
  const escaped = escapeRegex(specifier);
  const pattern = new RegExp(
    `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s*from\\s*["']${escaped}["']`,
    "g",
  );
  /** @type {string[]} */
  const symbols = [];
  for (const match of source.matchAll(pattern)) {
    for (const part of match[1].split(",")) {
      const symbol = extractSymbolName(part);
      if (symbol) symbols.push(symbol);
    }
  }

  const namespace = new RegExp(
    `import\\s+\\*\\s+as\\s+\\w+\\s+from\\s*["']${escaped}["']`,
  ).test(source);

  return { symbols, namespace };
}

/**
 * @param {string} source
 * @returns {string[]}
 */
function importSpecifiers(source) {
  /** @type {string[]} */
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

/**
 * @param {string} part
 * @returns {string | null}
 */
function extractSymbolName(part) {
  const cleaned = part
    .trim()
    .replace(/^type\s+/, "")
    .split(/\s+as\s+/)[0]
    .trim();
  return cleaned.length > 0 ? cleaned : null;
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
