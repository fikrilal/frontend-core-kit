// @ts-check
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { failed, passed } from "./result.mjs";

/**
 * Formats a list of files with Prettier in a single batch.
 *
 * @param {string[]} filePaths
 * @param {string} [root]
 */
export function formatFilesWithPrettier(filePaths, root = process.cwd()) {
  if (!filePaths || filePaths.length === 0) return;
  const localBin = path.join(root, "node_modules/.bin/prettier");
  const cwdBin = path.join(process.cwd(), "node_modules/.bin/prettier");
  const bin = fs.existsSync(localBin)
    ? localBin
    : fs.existsSync(cwdBin)
      ? cwdBin
      : "prettier";
  const repoConfig = path.join(process.cwd(), "prettier.config.mjs");
  const args = ["--write"];
  if (fs.existsSync(repoConfig)) {
    args.push("--config", repoConfig);
  }
  args.push(...filePaths);
  try {
    execFileSync(bin, args, { stdio: "ignore" });
  } catch {
    // If Prettier is unavailable, files remain as generated
  }
}

const namePattern = /^[a-z][a-z0-9]*([_-][a-z0-9]+)*$/;

/**
 * @typedef {object} ScaffoldFeatureOptions
 * @property {string} feature
 * @property {string} [slice]
 * @property {"authenticated" | "marketing"} [kind]
 * @property {boolean} [dryRun]
 * @property {boolean} [force]
 */

/**
 * @param {ScaffoldFeatureOptions} options
 * @param {{ root?: string }} [context]
 */
export function runScaffoldFeature(
  { feature, slice, kind = "authenticated", dryRun = false, force = false },
  { root = process.cwd() } = {},
) {
  if (!feature || !namePattern.test(feature)) {
    return failed({
      command: "scaffold:feature",
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

  const effectiveSlice =
    slice && slice.trim().length > 0 ? slice.trim() : feature;
  if (!namePattern.test(effectiveSlice)) {
    return failed({
      command: "scaffold:feature",
      summary: `Invalid slice name "${effectiveSlice}". Expected kebab-case or snake-case.`,
      details: [
        {
          name: "remediation",
          value: "Use kebab-case or snake-case, e.g. details or invoice-list.",
        },
      ],
    });
  }

  const featureMeta = parseName(feature);
  const sliceMeta = parseName(effectiveSlice);

  const componentPrefix =
    effectiveSlice === feature
      ? featureMeta.pascal
      : `${featureMeta.pascal}${sliceMeta.pascal}`;
  const pageComponentName = `${componentPrefix}Page`;
  const formComponentName = `${componentPrefix}Form`;
  const humanTitle =
    effectiveSlice === feature
      ? featureMeta.human
      : `${featureMeta.human} — ${sliceMeta.human}`;

  const routeGroup = kind === "marketing" ? "(marketing)" : "(authenticated)";
  const routePageDir =
    effectiveSlice === feature
      ? `src/app/${routeGroup}/${featureMeta.kebab}`
      : `src/app/${routeGroup}/${featureMeta.kebab}/${sliceMeta.kebab}`;
  const routePagePath = `${routePageDir}/page.tsx`;

  const featureDir = `src/features/${featureMeta.kebab}`;
  const sliceDir = `${featureDir}/${sliceMeta.kebab}`;
  const indexPath = `${featureDir}/index.ts`;

  const files = {
    [routePagePath]: routePageStub({
      pageComponentName,
      featureKebab: featureMeta.kebab,
      humanTitle,
      kind,
    }),
    [indexPath]: indexStub({
      pageComponentName,
      sliceKebab: sliceMeta.kebab,
    }),
    [`${sliceDir}/${sliceMeta.kebab}-page.tsx`]: pageStub({
      pageComponentName,
      formComponentName,
      sliceKebab: sliceMeta.kebab,
      humanTitle,
      featureKebab: featureMeta.kebab,
    }),
    [`${sliceDir}/${sliceMeta.kebab}-form.tsx`]: formStub({
      formComponentName,
      sliceKebab: sliceMeta.kebab,
      sliceCamel: sliceMeta.camel,
      slicePascal: sliceMeta.pascal,
    }),
    [`${sliceDir}/${sliceMeta.kebab}-state.ts`]: stateStub({
      sliceCamel: sliceMeta.camel,
      slicePascal: sliceMeta.pascal,
    }),
    [`${sliceDir}/${sliceMeta.kebab}-action.ts`]: actionStub({
      sliceKebab: sliceMeta.kebab,
      sliceCamel: sliceMeta.camel,
      slicePascal: sliceMeta.pascal,
    }),
    [`${sliceDir}/${sliceMeta.kebab}-failure.ts`]: failureStub({
      sliceKebab: sliceMeta.kebab,
      slicePascal: sliceMeta.pascal,
    }),
    [`${sliceDir}/${sliceMeta.kebab}-action.test.ts`]: actionTestStub({
      sliceKebab: sliceMeta.kebab,
      sliceCamel: sliceMeta.camel,
    }),
    [`${sliceDir}/${sliceMeta.kebab}-failure.test.ts`]: failureTestStub({
      sliceKebab: sliceMeta.kebab,
      slicePascal: sliceMeta.pascal,
    }),
  };

  const filePaths = Object.keys(files).toSorted();
  const directoryPaths = [
    ...new Set(filePaths.map((filePath) => path.posix.dirname(filePath))),
  ].toSorted();

  // Collision preflight
  if (!dryRun && !force) {
    const existing = filePaths.filter((relPath) => {
      if (relPath === indexPath) {
        const indexFile = path.join(root, indexPath);
        if (!fs.existsSync(indexFile)) return false;
        const source = fs.readFileSync(indexFile, "utf8");
        return source.includes(pageComponentName);
      }
      return fs.existsSync(path.join(root, relPath));
    });
    if (existing.length > 0) {
      return failed({
        command: "scaffold:feature",
        summary: `Refusing to scaffold: ${existing.length} file(s) already exist.`,
        details: [
          ...existing.slice(0, 5).map((relPath, index) => ({
            name: `existing-file-${index + 1}`,
            value: relPath,
          })),
          {
            name: "remediation",
            value:
              "Pass --force to overwrite existing files or choose another slice name.",
          },
        ],
      });
    }
  }

  if (dryRun) {
    return passed({
      command: "scaffold:feature",
      summary: `Dry run: would scaffold feature "${featureMeta.kebab}" (${filePaths.length} files).`,
      details: [
        { name: "feature", value: featureMeta.kebab },
        { name: "slice", value: sliceMeta.kebab },
        { name: "kind", value: kind },
        { name: "file-count", value: filePaths.length },
        ...filePaths.slice(0, 15).map((relPath, index) => ({
          name: `file-${index + 1}`,
          value: relPath,
        })),
      ],
    });
  }

  // Create directories
  for (const dirPath of directoryPaths) {
    fs.mkdirSync(path.join(root, dirPath), { recursive: true });
  }

  // Handle index.ts appending if feature already has other slices
  const indexFullPath = path.join(root, indexPath);
  let updatedIndexContent = files[indexPath];
  if (fs.existsSync(indexFullPath)) {
    const existingIndex = fs.readFileSync(indexFullPath, "utf8");
    const exportStatement = `export { ${pageComponentName} } from "./${sliceMeta.kebab}/${sliceMeta.kebab}-page";`;
    if (!existingIndex.includes(exportStatement)) {
      updatedIndexContent = `${existingIndex.trimEnd()}\n${exportStatement}\n`;
    } else {
      updatedIndexContent = existingIndex;
    }
  }
  files[indexPath] = updatedIndexContent;

  // Write files
  for (const [relPath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, relPath), content, "utf8");
  }

  const writtenFullPaths = filePaths.map((relPath) => path.join(root, relPath));
  formatFilesWithPrettier(writtenFullPaths, root);

  // Update site-metadata.ts if marketing kind
  if (kind === "marketing") {
    const routeUrlPath =
      effectiveSlice === feature
        ? `/${featureMeta.kebab}`
        : `/${featureMeta.kebab}/${sliceMeta.kebab}`;
    wireMarketingRoute(root, routeUrlPath);
  }

  return passed({
    command: "scaffold:feature",
    summary: `Feature "${featureMeta.kebab}" scaffolded successfully (${filePaths.length} files).`,
    details: [
      { name: "feature", value: featureMeta.kebab },
      { name: "slice", value: sliceMeta.kebab },
      { name: "kind", value: kind },
      { name: "route-page", value: routePagePath },
      { name: "file-count", value: filePaths.length },
      {
        name: "remediation",
        value: "Run pnpm verify:fast to verify the newly scaffolded feature.",
      },
    ],
  });
}

/**
 * @param {string} rawName
 */
export function parseName(rawName) {
  const parts = rawName
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const kebab = parts.join("-");
  const camel =
    parts[0] +
    parts
      .slice(1)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join("");
  const pascal = parts
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  const human = parts
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

  return { kebab, camel, pascal, human };
}

/**
 * @param {string} root
 * @param {string} routeUrlPath
 */
function wireMarketingRoute(root, routeUrlPath) {
  const siteMetadataPath = path.join(root, "src/app/site-metadata.ts");
  if (!fs.existsSync(siteMetadataPath)) return;

  const content = fs.readFileSync(siteMetadataPath, "utf8");
  const routeEntry = `  {\n    path: "${routeUrlPath}",\n    priority: 0.8,\n  },`;

  if (content.includes(`path: "${routeUrlPath}"`)) return;

  const match = content.match(
    /(export\s+const\s+publicRoutes\s*=\s*\[)([\s\S]*?)(\]\s*as\s+const)/,
  );
  if (!match) return;

  const updatedRoutes = `${match[1]}${match[2]}${routeEntry}\n${match[3]}`;
  const updatedContent = content.replace(match[0], updatedRoutes);
  fs.writeFileSync(siteMetadataPath, updatedContent, "utf8");
}

/**
 * @param {{ pageComponentName: string, featureKebab: string, humanTitle: string, kind: string }} input
 */
function routePageStub({ pageComponentName, featureKebab, humanTitle, kind }) {
  const functionName =
    kind === "marketing" ? `${pageComponentName}` : `${pageComponentName}Route`;
  return `import type { Metadata } from "next";

import { ${pageComponentName} } from "@/features/${featureKebab}";

export const metadata: Metadata = {
  title: "${humanTitle}",
};

export default function ${functionName}() {
  return <${pageComponentName} />;
}
`;
}

/**
 * @param {{ pageComponentName: string, sliceKebab: string }} input
 */
function indexStub({ pageComponentName, sliceKebab }) {
  return `export { ${pageComponentName} } from "./${sliceKebab}/${sliceKebab}-page";
`;
}

/**
 * @param {{ pageComponentName: string, formComponentName: string, sliceKebab: string, humanTitle: string, featureKebab: string }} input
 */
function pageStub({
  pageComponentName,
  formComponentName,
  sliceKebab,
  humanTitle,
  featureKebab,
}) {
  return `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ${formComponentName} } from "./${sliceKebab}-form";

export function ${pageComponentName}() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>${humanTitle}</CardTitle>
          <CardDescription>
            Manage your ${featureKebab} preferences and details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <${formComponentName} />
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

/**
 * @param {{ formComponentName: string, sliceKebab: string, sliceCamel: string, slicePascal: string }} input
 */
function formStub({ formComponentName, sliceKebab, sliceCamel, slicePascal }) {
  return `"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ${sliceCamel}Action } from "./${sliceKebab}-action";
import type { ${slicePascal}ActionState, ${slicePascal}Error } from "./${sliceKebab}-state";

const initialState: ${slicePascal}ActionState = {
  error: null,
  success: false,
};

export function ${formComponentName}() {
  const [state, action, pending] = useActionState(${sliceCamel}Action, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="${sliceKebab}-title">Title</Label>
        <Input
          aria-describedby={state.error ? "${sliceKebab}-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          id="${sliceKebab}-title"
          name="title"
          placeholder="Enter title"
          required
        />
      </div>

      {state.error ? (
        <Alert aria-live="polite" id="${sliceKebab}-error" variant="destructive">
          <AlertDescription className="text-destructive!">
            {messageFor${slicePascal}Error(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      {state.success ? (
        <Alert aria-live="polite" id="${sliceKebab}-success">
          <AlertDescription>Saved successfully.</AlertDescription>
        </Alert>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

function messageFor${slicePascal}Error(error: ${slicePascal}Error): string {
  switch (error) {
    case "invalidInput":
      return "Please check your input and try again.";
    case "unavailable":
      return "Service is temporarily unavailable. Please try again later.";
  }
}
`;
}

/**
 * @param {{ sliceCamel: string, slicePascal: string }} input
 */
function stateStub({ sliceCamel, slicePascal }) {
  return `import { z } from "zod";

export const ${sliceCamel}InputSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
});

export type ${slicePascal}Input = z.infer<typeof ${sliceCamel}InputSchema>;

export type ${slicePascal}Error = "invalidInput" | "unavailable";

export type ${slicePascal}ActionState = Readonly<{
  error: ${slicePascal}Error | null;
  success: boolean;
}>;
`;
}

/**
 * @param {{ sliceKebab: string, sliceCamel: string, slicePascal: string }} input
 */
function actionStub({ sliceKebab, sliceCamel, slicePascal }) {
  return `"use server";

import {
  ${sliceCamel}InputSchema,
  type ${slicePascal}ActionState,
} from "./${sliceKebab}-state";

export async function ${sliceCamel}Action(
  _previousState: ${slicePascal}ActionState,
  formData: FormData,
): Promise<${slicePascal}ActionState> {
  const input = ${sliceCamel}InputSchema.safeParse({
    title: formData.get("title"),
  });

  if (!input.success) {
    return { error: "invalidInput", success: false };
  }

  return { error: null, success: true };
}
`;
}

/**
 * @param {{ sliceKebab: string, slicePascal: string }} input
 */
function failureStub({ sliceKebab, slicePascal }) {
  return `import "server-only";

import type { ${slicePascal}Error } from "./${sliceKebab}-state";

export function map${slicePascal}Failure(status: number | null): ${slicePascal}Error {
  switch (status) {
    case 400:
    case 422:
      return "invalidInput";
    default:
      return "unavailable";
  }
}
`;
}

/**
 * @param {{ sliceKebab: string, sliceCamel: string }} input
 */
function actionTestStub({ sliceKebab, sliceCamel }) {
  return `import { describe, expect, it } from "vitest";

import { ${sliceCamel}Action } from "./${sliceKebab}-action";

describe("${sliceCamel}Action", () => {
  it("rejects empty input with invalidInput", async () => {
    const formData = new FormData();
    formData.set("title", "");
    const result = await ${sliceCamel}Action(
      { error: null, success: false },
      formData,
    );
    expect(result).toEqual({ error: "invalidInput", success: false });
  });

  it("accepts valid input", async () => {
    const formData = new FormData();
    formData.set("title", "Valid Title");
    const result = await ${sliceCamel}Action(
      { error: null, success: false },
      formData,
    );
    expect(result).toEqual({ error: null, success: true });
  });
});
`;
}

/**
 * @param {{ sliceKebab: string, slicePascal: string }} input
 */
function failureTestStub({ sliceKebab, slicePascal }) {
  return `import { describe, expect, it } from "vitest";

import { map${slicePascal}Failure } from "./${sliceKebab}-failure";

describe("map${slicePascal}Failure", () => {
  it("maps validation HTTP statuses to invalidInput", () => {
    expect(map${slicePascal}Failure(400)).toBe("invalidInput");
    expect(map${slicePascal}Failure(422)).toBe("invalidInput");
  });

  it("maps server or null HTTP statuses to unavailable", () => {
    expect(map${slicePascal}Failure(500)).toBe("unavailable");
    expect(map${slicePascal}Failure(null)).toBe("unavailable");
  });
});
`;
}
