// @ts-check

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

import { CliUsageError, failed, passed } from "./result.mjs";
import {
  formatFilesWithPrettier,
  parseName,
  runScaffoldFeature,
} from "./scaffold.mjs";

const defaultSpecPath = "src/contracts/example-api/openapi.yaml";
const namePattern = /^[a-z][a-z0-9]*([_-][a-z0-9]+)*$/;

/**
 * @typedef {object} OpenApiOperation
 * @property {string} operationId
 * @property {string} httpMethod
 * @property {string} path
 * @property {string} summary
 * @property {string} description
 * @property {string[]} tags
 * @property {boolean} requiresAuth
 * @property {{ path: string[], query: string[] }} parameters
 * @property {boolean} hasRequestBody
 * @property {number} successStatus
 * @property {boolean} isVoidResponse
 * @property {boolean} isEnvelope
 * @property {string} responseSchemaName
 * @property {unknown} mockData
 */

/**
 * Resolves a JSON schema reference against the OpenAPI document.
 *
 * @param {string} ref
 * @param {any} doc
 */
function resolveSchemaRef(ref, doc) {
  const parts = ref.replace(/^#\//, "").split("/");
  let curr = doc;
  for (const part of parts) {
    if (curr && typeof curr === "object") {
      curr = curr[part];
    } else {
      return null;
    }
  }
  return curr;
}

/**
 * Generates a minimal valid mock fixture conforming to the given OpenAPI schema.
 *
 * @param {any} schema
 * @param {any} doc
 * @param {number} [depth]
 * @returns {any}
 */
function mockSchema(schema, doc, depth = 0) {
  if (!schema || depth > 8) return {};
  if (schema.$ref) {
    return mockSchema(resolveSchemaRef(schema.$ref, doc), doc, depth + 1);
  }
  if (schema.allOf) {
    /** @type {Record<string, unknown>} */
    const combined = {};
    for (const sub of schema.allOf) {
      Object.assign(combined, mockSchema(sub, doc, depth + 1));
    }
    return combined;
  }
  if (schema.example !== undefined) return schema.example;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];
  if (schema.type === "string") {
    if (schema.format === "date-time") return "2026-01-01T00:00:00.000Z";
    return "test";
  }
  if (schema.type === "boolean") return true;
  if (schema.type === "integer" || schema.type === "number") return 0;
  if (schema.type === "array") {
    if (schema.items) {
      const item = mockSchema(schema.items, doc, depth + 1);
      return [item];
    }
    return [];
  }
  if (schema.type === "object" || schema.properties) {
    /** @type {Record<string, unknown>} */
    const obj = {};
    const props = schema.properties || {};
    const req = schema.required || Object.keys(props);
    for (const key of req) {
      if (props[key]) {
        obj[key] = mockSchema(props[key], doc, depth + 1);
      } else {
        obj[key] = "test";
      }
    }
    return obj;
  }
  return {};
}

/**
 * Parses an OpenAPI 3.0 specification from disk and extracts all operations.
 *
 * @param {string} specRelativePath
 * @param {{ root?: string }} [context]
 * @returns {OpenApiOperation[]}
 */
export function parseOpenApiSpec(
  specRelativePath,
  { root = process.cwd() } = {},
) {
  let fullPath = path.isAbsolute(specRelativePath)
    ? specRelativePath
    : path.join(root, specRelativePath);

  if (!fs.existsSync(fullPath)) {
    if (specRelativePath === defaultSpecPath) {
      const cwdFallback = path.join(process.cwd(), defaultSpecPath);
      if (fs.existsSync(cwdFallback)) {
        fullPath = cwdFallback;
      } else {
        throw new Error(
          `OpenAPI specification not found at "${specRelativePath}".`,
        );
      }
    } else {
      throw new Error(
        `OpenAPI specification not found at "${specRelativePath}".`,
      );
    }
  }

  const rawContent = fs.readFileSync(fullPath, "utf8");
  const spec = YAML.parse(rawContent);

  if (
    !spec ||
    typeof spec !== "object" ||
    !spec.paths ||
    typeof spec.paths !== "object"
  ) {
    throw new Error(
      `Invalid OpenAPI specification at "${specRelativePath}". Missing "paths".`,
    );
  }

  /** @type {OpenApiOperation[]} */
  const operations = [];
  const httpMethods = ["get", "post", "put", "delete", "patch"];

  for (const [routePath, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const method of httpMethods) {
      if (!pathItem[method] || typeof pathItem[method] !== "object") continue;

      const op = pathItem[method];
      const rawOpId = typeof op.operationId === "string" ? op.operationId : "";
      const operationId =
        rawOpId || `${method}_${routePath.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const summary = typeof op.summary === "string" ? op.summary : "";
      const description =
        typeof op.description === "string" ? op.description : "";
      const tags = Array.isArray(op.tags) ? op.tags.map(String) : [];
      const security = Array.isArray(op.security)
        ? op.security
        : Array.isArray(spec.security)
          ? spec.security
          : [];
      const requiresAuth = security.length > 0;

      /** @type {string[]} */
      const pathParams = [];
      /** @type {string[]} */
      const queryParams = [];

      if (Array.isArray(op.parameters)) {
        for (const param of op.parameters) {
          if (!param || typeof param !== "object") continue;
          if (param.in === "path" && typeof param.name === "string") {
            pathParams.push(param.name);
          } else if (param.in === "query" && typeof param.name === "string") {
            queryParams.push(param.name);
          }
        }
      }

      const hasRequestBody = Boolean(
        op.requestBody &&
        typeof op.requestBody === "object" &&
        op.requestBody.content &&
        typeof op.requestBody.content === "object" &&
        op.requestBody.content["application/json"],
      );

      // Determine success status code & content schema
      let successStatus = 200;
      let has2xxContent = false;
      let responseContentSchema = null;
      if (op.responses && typeof op.responses === "object") {
        for (const code of ["200", "201", "204", "202"]) {
          if (op.responses[code]) {
            successStatus = Number.parseInt(code, 10);
            if (
              op.responses[code].content &&
              typeof op.responses[code].content === "object" &&
              op.responses[code].content["application/json"]
            ) {
              has2xxContent = true;
              responseContentSchema =
                op.responses[code].content["application/json"].schema;
            }
            break;
          }
        }
      }

      const opMeta = parseOperationId(operationId);
      const expectedSchemaName = `${opMeta.pascal}Response`;
      let isVoidResponse = successStatus === 204 || !has2xxContent;

      let runtimeGenPath = path.join(
        root,
        "src/contracts/example-api/runtime.generated.ts",
      );
      if (!fs.existsSync(runtimeGenPath)) {
        runtimeGenPath = path.join(
          process.cwd(),
          "src/contracts/example-api/runtime.generated.ts",
        );
      }
      if (fs.existsSync(runtimeGenPath)) {
        const runtimeGenSource = fs.readFileSync(runtimeGenPath, "utf8");
        if (
          runtimeGenSource.includes(
            `export const ${expectedSchemaName} = zod.void();`,
          )
        ) {
          isVoidResponse = true;
        } else if (
          runtimeGenSource.includes(`export const ${expectedSchemaName} =`)
        ) {
          isVoidResponse = false;
        }
      }

      // Check whether response is enveloped { data, meta? }
      let isEnvelope = false;
      if (responseContentSchema && !isVoidResponse) {
        const resolved = responseContentSchema.$ref
          ? resolveSchemaRef(responseContentSchema.$ref, spec)
          : responseContentSchema;
        if (resolved && resolved.properties && resolved.properties.data) {
          isEnvelope = true;
        } else if (
          responseContentSchema.$ref &&
          responseContentSchema.$ref.includes("Envelope")
        ) {
          isEnvelope = true;
        }
      }

      // Construct mock fixture
      let mockData = null;
      if (!isVoidResponse && responseContentSchema) {
        mockData = mockSchema(responseContentSchema, spec);
      }

      operations.push({
        operationId,
        httpMethod: method.toUpperCase(),
        path: routePath,
        summary,
        description,
        tags,
        requiresAuth,
        parameters: { path: pathParams, query: queryParams },
        hasRequestBody,
        successStatus,
        isVoidResponse,
        isEnvelope,
        responseSchemaName: expectedSchemaName,
        mockData,
      });
    }
  }

  return operations;
}

/**
 * Finds an operation by operationId (exact or normalized), METHOD /path, or alias.
 *
 * @param {OpenApiOperation[]} operations
 * @param {string} query
 * @returns {OpenApiOperation | null}
 */
export function findOpenApiOperation(operations, query) {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const stripped = lower.replace(/[^a-z0-9]/g, "");

  // 1. Exact operationId match
  for (const op of operations) {
    if (op.operationId.toLowerCase() === lower) return op;
  }

  // 2. METHOD /path match
  for (const op of operations) {
    const methodPath = `${op.httpMethod} ${op.path}`.toLowerCase();
    if (methodPath === lower || op.path.toLowerCase() === lower) return op;
  }

  // 3. Stripped match (e.g. users_me_get vs users.me.get vs users-me-get)
  for (const op of operations) {
    if (op.operationId.toLowerCase().replace(/[^a-z0-9]/g, "") === stripped) {
      return op;
    }
  }

  // 4. Aliases (e.g. users.profile.get -> users.me.get)
  if (lower === "users.profile.get" || stripped === "usersprofileget") {
    const meGet = operations.find((op) => op.operationId === "users.me.get");
    if (meGet) return meGet;
  }

  // 5. Keyword search across summary, description, and tags
  const words = lower.split(/[._\s/-]+/).filter(Boolean);
  if (words.length > 0) {
    for (const op of operations) {
      const haystack =
        `${op.operationId} ${op.summary} ${op.description} ${op.tags.join(" ")} ${op.httpMethod}`.toLowerCase();
      if (words.every((word) => haystack.includes(word))) {
        return op;
      }
    }
  }

  return null;
}

/**
 * Normalizes an operationId into camelCase, PascalCase, and kebab-case identifiers.
 *
 * @param {string} operationId
 */
export function parseOperationId(operationId) {
  const parts = operationId
    .replace(/[._/-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const camel =
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join("");

  const pascal = parts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");

  const kebab = parts.map((p) => p.toLowerCase()).join("-");

  return { parts, camel, pascal, kebab };
}

/**
 * Generates the TypeScript source for a typed feature server adapter.
 *
 * @param {{
 *   featureMeta: ReturnType<typeof parseName>;
 *   operation: OpenApiOperation;
 * }} input
 */
function generateServerAdapterSource({ featureMeta, operation }) {
  const opMeta = parseOperationId(operation.operationId);
  const functionName = opMeta.camel;
  const pathConstName = `${opMeta.camel}Path`;
  const timeoutConstName = `${featureMeta.camel}RequestTimeoutMs`;
  const opPascal = opMeta.pascal;

  const requiresAuth = operation.requiresAuth;
  const hasPathParams = operation.parameters.path.length > 0;
  const hasQueryParams = operation.parameters.query.length > 0;
  const hasRequestBody = operation.hasRequestBody;
  const isVoid = operation.isVoidResponse;
  const isEnvelope = operation.isEnvelope;

  const runtimeImport = isVoid
    ? ""
    : `import { ${operation.responseSchemaName} } from "@/contracts/example-api/runtime";\n`;

  const readerFn = isVoid
    ? "readEmptyApiResult"
    : isEnvelope
      ? "readApiResult"
      : "readPlainApiResult";

  const pathDecl = `const ${pathConstName} = "${operation.path}" as const;`;
  const formattedPathDecl =
    pathDecl.length > 80
      ? `const ${pathConstName} =\n  "${operation.path}" as const;`
      : pathDecl;

  const opTypeDecl = `type ${opPascal}Operation = operations["${operation.operationId}"];`;
  const formattedOpType =
    opTypeDecl.length > 80
      ? `type ${opPascal}Operation =\n  operations["${operation.operationId}"];\n`
      : `${opTypeDecl}\n`;

  let typeSection = formattedOpType;
  if (!isVoid) {
    typeSection += `\ntype ${opPascal}Envelope =\n  ${opPascal}Operation["responses"][${operation.successStatus}]["content"]["application/json"];\n`;
    if (isEnvelope) {
      const line1 = `export type ${opPascal}Data = ${opPascal}Envelope extends {`;
      if (line1.length <= 80) {
        typeSection += `\nexport type ${opPascal}Data = ${opPascal}Envelope extends {\n  data: infer TData;\n}\n  ? TData\n  : ${opPascal}Envelope;\n`;
      } else {
        typeSection += `\nexport type ${opPascal}Data =\n  ${opPascal}Envelope extends {\n    data: infer TData;\n  }\n    ? TData\n    : ${opPascal}Envelope;\n`;
      }
    } else {
      const plainDecl = `export type ${opPascal}Data = ${opPascal}Envelope;`;
      if (plainDecl.length > 80) {
        typeSection += `\nexport type ${opPascal}Data =\n  ${opPascal}Envelope;\n`;
      } else {
        typeSection += `\nexport type ${opPascal}Data = ${opPascal}Envelope;\n`;
      }
    }
  }
  if (hasRequestBody) {
    typeSection += `\nexport type ${opPascal}Input =\n  ${opPascal}Operation["requestBody"]["content"]["application/json"];\n`;
  }
  if (hasPathParams) {
    typeSection += `\nexport type ${opPascal}PathParams =\n  ${opPascal}Operation["parameters"]["path"];\n`;
  }
  if (hasQueryParams) {
    typeSection += `\nexport type ${opPascal}QueryParams =\n  ${opPascal}Operation["parameters"]["query"];\n`;
  }

  // Parameter ordering: required (input, pathParams, accessToken) BEFORE optional (queryParams?)
  const paramList = [];
  if (hasRequestBody) {
    paramList.push(`input: ${opPascal}Input`);
  }
  if (hasPathParams) {
    paramList.push(`pathParams: ${opPascal}PathParams`);
  }
  if (requiresAuth) {
    paramList.push("accessToken: string");
  }
  if (hasQueryParams) {
    paramList.push(`queryParams?: ${opPascal}QueryParams`);
  }

  const requestOptions = [];
  if (hasRequestBody) {
    requestOptions.push("body: input,");
  }
  requestOptions.push('cache: "no-store",');
  if (requiresAuth) {
    requestOptions.push(
      "headers: {\n      Authorization: `Bearer ${accessToken}`,\n    },",
    );
  }
  if (hasPathParams || hasQueryParams) {
    const paramsInner = [];
    if (hasPathParams) paramsInner.push("path: pathParams,");
    if (hasQueryParams) paramsInner.push("query: queryParams,");
    requestOptions.push(
      `params: {\n      ${paramsInner.join("\n      ")}\n    },`,
    );
  }
  requestOptions.push('parseAs: "text",');
  requestOptions.push(`signal: AbortSignal.timeout(${timeoutConstName}),`);

  const returnType = isVoid ? "undefined" : `${opPascal}Data`;
  const returnCall = isVoid
    ? "readEmptyApiResult(request);"
    : `${readerFn}(request, ${operation.responseSchemaName});`;

  const functionSignature =
    paramList.length === 0
      ? `export async function ${functionName}(): Promise<ApiResult<${returnType}>> {`
      : `export async function ${functionName}(\n  ${paramList.join(",\n  ")},\n): Promise<ApiResult<${returnType}>> {`;

  return `import "server-only";

import type { operations } from "@/contracts/example-api";
${runtimeImport}import {
  createConfiguredExampleApiClient,
  ${readerFn},
  type ApiResult,
} from "@/server/api";

${formattedPathDecl}
const ${timeoutConstName} = 10_000;

${typeSection}
${functionSignature}
  const client = createConfiguredExampleApiClient();
  const request = client.${operation.httpMethod}(${pathConstName}, {
    ${requestOptions.join("\n    ")}
  });

  return ${returnCall}
}
`;
}

/**
 * Generates the TypeScript unit test for a typed feature server adapter.
 *
 * @param {{
 *   featureMeta: ReturnType<typeof parseName>;
 *   operation: OpenApiOperation;
 * }} input
 */
function generateServerAdapterTestSource({ featureMeta, operation }) {
  const opMeta = parseOperationId(operation.operationId);
  const functionName = opMeta.camel;
  const opPascal = opMeta.pascal;
  const isVoid = operation.isVoidResponse;
  const requiresAuth = operation.requiresAuth;
  const hasRequestBody = operation.hasRequestBody;
  const hasPathParams = operation.parameters.path.length > 0;
  const hasQueryParams = operation.parameters.query.length > 0;

  const importedTypes = [];
  if (hasRequestBody) importedTypes.push(`type ${opPascal}Input`);
  if (hasPathParams) importedTypes.push(`type ${opPascal}PathParams`);
  if (!isVoid) importedTypes.push(`type ${opPascal}Data`);

  const allImports = [functionName, ...importedTypes];
  const singleLineImport = `import { ${allImports.join(", ")} } from "./${featureMeta.kebab}-api";`;
  const importStatement =
    allImports.length <= 1 || singleLineImport.length <= 80
      ? singleLineImport
      : `import {\n  ${allImports.join(",\n  ")},\n} from "./${featureMeta.kebab}-api";`;

  // Call arguments ordered: input, pathParams, accessToken, queryParams?
  const dummyArgs = [];
  let fixtures = "";

  if (hasRequestBody) {
    fixtures += `const testInput = {} as ${opPascal}Input;\n`;
    dummyArgs.push("testInput");
  }
  if (hasPathParams) {
    const props = operation.parameters.path
      .map((p) => `${p}: "test-id"`)
      .join(", ");
    const singleLine = `const testPathParams = { ${props} } as ${opPascal}PathParams;\n`;
    if (singleLine.length <= 80) {
      fixtures += singleLine;
    } else {
      const multiProps = operation.parameters.path
        .map((p) => `  ${p}: "test-id",`)
        .join("\n");
      fixtures += `const testPathParams = {\n${multiProps}\n} as ${opPascal}PathParams;\n`;
    }
    dummyArgs.push("testPathParams");
  }
  if (requiresAuth) {
    dummyArgs.push('"test-token"');
  }
  if (hasQueryParams) {
    dummyArgs.push("undefined");
  }

  const callArgs = dummyArgs.join(", ");
  const singleLineResultCall = `const result = await ${functionName}(${callArgs});`;
  const resultCall =
    singleLineResultCall.length <= 80
      ? singleLineResultCall
      : `const result = await ${functionName}(\n      ${dummyArgs.join(",\n      ")},\n    );`;

  let responseConstructor;
  if (isVoid) {
    responseConstructor = `new Response(null, {\n          status: ${operation.successStatus},\n        }),`;
  } else {
    const payloadStr = JSON.stringify(operation.mockData ?? { data: {} })
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
    const singleLineStart = `        new Response('${payloadStr}', {`;
    if (singleLineStart.length <= 80) {
      responseConstructor = `new Response('${payloadStr}', {\n          status: ${operation.successStatus},\n          headers: { "Content-Type": "application/json" },\n        }),`;
    } else {
      responseConstructor = `new Response(\n          '${payloadStr}',\n          {\n            status: ${operation.successStatus},\n            headers: { "Content-Type": "application/json" },\n          },\n        ),`;
    }
  }

  return `import { afterEach, describe, expect, it, vi } from "vitest";

${importStatement}

${fixtures}afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("${featureMeta.human} server API", () => {
  it("executes ${functionName} successfully", async () => {
    let captured: Request | undefined;
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", (request: Request) => {
      captured = request;
      return Promise.resolve(
        ${responseConstructor}
      );
    });

    ${resultCall}

    expect(result).toMatchObject({
      ok: true,
      status: ${operation.successStatus},
    });
    expect(captured).toBeDefined();
    expect(captured?.method).toBe("${operation.httpMethod}");
    expect(captured?.cache).toBe("no-store");${requiresAuth ? '\n    expect(captured?.headers.get("authorization")).toBe("Bearer test-token");' : ""}
  });

  it("handles ${functionName} failure response", async () => {
    vi.stubEnv("EXAMPLE_API_BASE_URL", "https://api.example.dev");
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            type: "https://errors.example.dev/problem",
            title: "Bad Request",
            status: 400,
            detail: "Invalid request payload",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/problem+json" },
          },
        ),
      ),
    );

    ${resultCall}

    expect(result).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});
`;
}

/**
 * @typedef {object} ScaffoldDataOptions
 * @property {string} [feature]
 * @property {string} [operation]
 * @property {string} [openapiSpec]
 * @property {boolean} [dryRun]
 * @property {boolean} [force]
 * @property {boolean} [list]
 * @property {string} [filter]
 */

/**
 * Executes the `scaffold data` command.
 *
 * @param {ScaffoldDataOptions} options
 * @param {{ root?: string }} [context]
 */
export function runScaffoldData(options, { root = process.cwd() } = {}) {
  const specPath =
    options.openapiSpec && options.openapiSpec.trim().length > 0
      ? options.openapiSpec.trim()
      : defaultSpecPath;

  let operations;
  try {
    operations = parseOpenApiSpec(specPath, { root });
  } catch (error) {
    return failed({
      command: "scaffold:data",
      summary: error instanceof Error ? error.message : String(error),
      details: [
        { name: "spec-path", value: specPath },
        {
          name: "remediation",
          value: "Verify that the OpenAPI specification file exists.",
        },
      ],
    });
  }

  // Handle --list
  if (options.list) {
    const filter = options.filter ? options.filter.trim().toLowerCase() : "";
    const filtered = filter
      ? operations.filter(
          (op) =>
            op.operationId.toLowerCase().includes(filter) ||
            op.path.toLowerCase().includes(filter) ||
            op.summary.toLowerCase().includes(filter),
        )
      : operations;

    const maxDetails = 45;
    const items = filtered.slice(0, maxDetails).map((op, index) => ({
      name: `op-${index + 1}`,
      value: `${op.operationId} [${op.httpMethod} ${op.path}] - ${op.summary || "No summary"}`,
    }));

    if (filtered.length > maxDetails) {
      items.push({
        name: "more-operations",
        value: `... and ${filtered.length - maxDetails} more operations. Use --filter to narrow results.`,
      });
    }

    return passed({
      command: "scaffold:data",
      summary: `Found ${filtered.length} OpenAPI operation(s) in "${specPath}".`,
      details: items,
    });
  }

  const {
    feature,
    operation: operationQuery,
    dryRun = false,
    force = false,
  } = options;

  if (!feature || !namePattern.test(feature)) {
    return failed({
      command: "scaffold:data",
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

  if (!operationQuery || operationQuery.trim().length === 0) {
    return failed({
      command: "scaffold:data",
      summary: "Missing required option: --operation.",
      details: [
        {
          name: "remediation",
          value:
            "Specify an operationId or METHOD /path, e.g. --operation users.me.get.",
        },
      ],
    });
  }

  const matchedOp = findOpenApiOperation(operations, operationQuery);
  if (!matchedOp) {
    const available = operations
      .slice(0, 10)
      .map((op) => `${op.operationId} (${op.httpMethod} ${op.path})`);
    return failed({
      command: "scaffold:data",
      summary: `OpenAPI operation "${operationQuery}" not found in "${specPath}".`,
      details: [
        { name: "available-operations", value: available.join(", ") },
        { name: "total-operations", value: String(operations.length) },
        {
          name: "remediation",
          value:
            "Use `frontendkit scaffold data --list` to browse all available operations.",
        },
      ],
    });
  }

  const featureMeta = parseName(feature);
  const serverDir = `src/features/${featureMeta.kebab}/server`;
  const apiFilePath = `${serverDir}/${featureMeta.kebab}-api.ts`;
  const testFilePath = `${serverDir}/${featureMeta.kebab}-api.test.ts`;

  const rawApiSource = generateServerAdapterSource({
    featureMeta,
    operation: matchedOp,
  });
  const rawTestSource = generateServerAdapterTestSource({
    featureMeta,
    operation: matchedOp,
  });

  const files = {
    [apiFilePath]: rawApiSource,
    [testFilePath]: rawTestSource,
  };

  const filePaths = Object.keys(files).toSorted();

  // Collision preflight
  if (!dryRun && !force) {
    const existing = filePaths.filter((relPath) =>
      fs.existsSync(path.join(root, relPath)),
    );
    if (existing.length > 0) {
      return failed({
        command: "scaffold:data",
        summary: `Refusing to scaffold data: ${existing.length} file(s) already exist.`,
        details: [
          ...existing.map((relPath, index) => ({
            name: `existing-file-${index + 1}`,
            value: relPath,
          })),
          {
            name: "remediation",
            value: "Pass --force to overwrite existing files.",
          },
        ],
      });
    }
  }

  if (dryRun) {
    return passed({
      command: "scaffold:data",
      summary: `Dry run: would scaffold data for feature "${featureMeta.kebab}" and operation "${matchedOp.operationId}".`,
      details: [
        { name: "feature", value: featureMeta.kebab },
        { name: "operation", value: matchedOp.operationId },
        { name: "method", value: matchedOp.httpMethod },
        { name: "path", value: matchedOp.path },
        { name: "file-count", value: filePaths.length },
        ...filePaths.map((relPath, index) => ({
          name: `file-${index + 1}`,
          value: relPath,
        })),
        { name: "preview-api", value: apiFilePath },
        { name: "preview-test", value: testFilePath },
      ],
    });
  }

  fs.mkdirSync(path.join(root, serverDir), { recursive: true });

  for (const [relPath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, relPath), content, "utf8");
  }

  const writtenFullPaths = filePaths.map((relPath) => path.join(root, relPath));
  formatFilesWithPrettier(writtenFullPaths, root);

  return passed({
    command: "scaffold:data",
    summary: `OpenAPI data adapter for "${matchedOp.operationId}" scaffolded successfully (${filePaths.length} files).`,
    details: [
      { name: "feature", value: featureMeta.kebab },
      { name: "operation", value: matchedOp.operationId },
      { name: "adapter-file", value: apiFilePath },
      { name: "test-file", value: testFilePath },
      { name: "file-count", value: filePaths.length },
      {
        name: "remediation",
        value: "Run pnpm test to verify the newly scaffolded data adapter.",
      },
    ],
  });
}

/**
 * @typedef {object} ScaffoldAllOptions
 * @property {string} feature
 * @property {string} operation
 * @property {string} [slice]
 * @property {"authenticated" | "marketing"} [kind]
 * @property {string} [openapiSpec]
 * @property {boolean} [dryRun]
 * @property {boolean} [force]
 */

/**
 * Executes composite `scaffold all` command.
 *
 * @param {ScaffoldAllOptions} options
 * @param {{ root?: string }} [context]
 */
export function runScaffoldAll(options, { root = process.cwd() } = {}) {
  const {
    feature,
    operation,
    slice,
    kind = "authenticated",
    openapiSpec,
    dryRun = false,
    force = false,
  } = options;

  const specPath =
    openapiSpec && openapiSpec.trim().length > 0
      ? openapiSpec.trim()
      : defaultSpecPath;

  let operations;
  try {
    operations = parseOpenApiSpec(specPath, { root });
  } catch (error) {
    return failed({
      command: "scaffold:all",
      summary: error instanceof Error ? error.message : String(error),
      details: [
        { name: "spec-path", value: specPath },
        {
          name: "remediation",
          value: "Verify that the OpenAPI specification file exists.",
        },
      ],
    });
  }

  const matchedOp = findOpenApiOperation(operations, operation);
  if (!matchedOp) {
    const available = operations
      .slice(0, 10)
      .map((op) => `${op.operationId} (${op.httpMethod} ${op.path})`);
    return failed({
      command: "scaffold:all",
      summary: `OpenAPI operation "${operation}" not found in "${specPath}".`,
      details: [
        { name: "available-operations", value: available.join(", ") },
        { name: "total-operations", value: String(operations.length) },
        {
          name: "remediation",
          value:
            "Use `frontendkit scaffold data --list` to browse all available operations.",
        },
      ],
    });
  }

  if (dryRun) {
    const featureDry = runScaffoldFeature(
      { feature, slice, kind, dryRun: true, force: true },
      { root },
    );
    if (featureDry.status !== "passed") return featureDry;

    const dataDry = runScaffoldData(
      {
        feature,
        operation: matchedOp.operationId,
        openapiSpec,
        dryRun: true,
        force: true,
      },
      { root },
    );
    if (dataDry.status !== "passed") return dataDry;

    const featureDetails = featureDry.details.filter((d) =>
      d.name.startsWith("file-"),
    );
    const dataDetails = dataDry.details.filter((d) =>
      d.name.startsWith("file-"),
    );

    return passed({
      command: "scaffold:all",
      summary: `Dry run: would scaffold feature "${feature}" and data adapter for "${matchedOp.operationId}".`,
      details: [
        { name: "feature", value: feature },
        { name: "operation", value: matchedOp.operationId },
        { name: "kind", value: kind },
        ...featureDetails,
        ...dataDetails,
      ],
    });
  }

  // 1. Scaffold feature skeleton
  const featureResult = runScaffoldFeature(
    { feature, slice, kind, force, dryRun: false },
    { root },
  );
  if (featureResult.status !== "passed") {
    return featureResult;
  }

  // 2. Scaffold data layer with resolved operationId
  const dataResult = runScaffoldData(
    {
      feature,
      operation: matchedOp.operationId,
      openapiSpec,
      force,
      dryRun: false,
    },
    { root },
  );
  if (dataResult.status !== "passed") {
    return dataResult;
  }

  // 3. Link server adapter into slice action using resolved function name
  const featureMeta = parseName(feature);
  const effectiveSlice =
    slice && slice.trim().length > 0 ? slice.trim() : feature;
  const sliceMeta = parseName(effectiveSlice);
  const actionFile = path.join(
    root,
    `src/features/${featureMeta.kebab}/${sliceMeta.kebab}/${sliceMeta.kebab}-action.ts`,
  );

  const opMeta = parseOperationId(matchedOp.operationId);
  const functionName = opMeta.camel;

  if (fs.existsSync(actionFile)) {
    const actionContent = fs.readFileSync(actionFile, "utf8");
    const importStmt = `import { ${functionName} } from "../server/${featureMeta.kebab}-api";\n`;
    if (!actionContent.includes(functionName)) {
      let updated = actionContent.replace(
        '"use server";\n\n',
        `"use server";\n\n${importStmt}`,
      );
      updated = updated.replace(
        "return { error: null, success: true };",
        `// Linked server API adapter\n  void ${functionName};\n\n  return { error: null, success: true };`,
      );
      fs.writeFileSync(actionFile, updated, "utf8");
      formatFilesWithPrettier([actionFile], root);
    }
  }

  return passed({
    command: "scaffold:all",
    summary: `Feature "${featureMeta.kebab}" with OpenAPI data adapter for "${matchedOp.operationId}" scaffolded successfully.`,
    details: [
      { name: "feature", value: featureMeta.kebab },
      { name: "operation", value: matchedOp.operationId },
      { name: "slice", value: sliceMeta.kebab },
      { name: "kind", value: kind },
      {
        name: "remediation",
        value:
          "Run pnpm verify:fast to verify the newly scaffolded feature and data layer.",
      },
    ],
  });
}

/**
 * @param {readonly string[]} values
 * @returns {ScaffoldDataOptions}
 */
export function parseScaffoldDataArguments(values) {
  let feature = "";
  let operation = "";
  let openapiSpec = "";
  let dryRun = false;
  let force = false;
  let list = false;
  let filter = "";

  const positional = [];

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--dry-run") {
      dryRun = true;
    } else if (value === "--force") {
      force = true;
    } else if (value === "--list") {
      list = true;
    } else if (value === "--filter") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --filter option requires a value.");
      }
      filter = next;
    } else if (value === "--feature" || value === "-f") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --feature option requires a value.");
      }
      feature = next;
    } else if (value === "--operation" || value === "-o") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --operation option requires a value.");
      }
      operation = next;
    } else if (value === "--openapi-spec") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --openapi-spec option requires a value.");
      }
      openapiSpec = next;
    } else if (value.startsWith("--")) {
      throw new CliUsageError(`Unknown scaffold data option: ${value}.`);
    } else {
      positional.push(value);
    }
  }

  if (!feature && positional.length > 0) {
    feature = positional.shift() || "";
  }
  if (!operation && positional.length > 0) {
    operation = positional.shift() || "";
  }

  if (positional.length > 0) {
    throw new CliUsageError(`Unexpected extra argument: ${positional[0]}.`);
  }

  if (!list && !feature) {
    throw new CliUsageError("Missing required option: --feature (-f).");
  }
  if (!list && !operation) {
    throw new CliUsageError("Missing required option: --operation (-o).");
  }

  return { feature, operation, openapiSpec, dryRun, force, list, filter };
}

/**
 * @param {readonly string[]} values
 * @returns {ScaffoldAllOptions}
 */
export function parseScaffoldAllArguments(values) {
  let feature = "";
  let operation = "";
  let slice;
  /** @type {"authenticated" | "marketing"} */
  let kind = "authenticated";
  let openapiSpec = "";
  let dryRun = false;
  let force = false;

  const positional = [];

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--dry-run") {
      dryRun = true;
    } else if (value === "--force") {
      force = true;
    } else if (value === "--slice" || value === "-s") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --slice option requires a value.");
      }
      slice = next;
    } else if (value === "--kind") {
      index += 1;
      const next = values[index];
      if (next !== "authenticated" && next !== "marketing") {
        throw new CliUsageError(
          "The --kind option must be authenticated or marketing.",
        );
      }
      kind = next;
    } else if (value === "--feature" || value === "-f") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --feature option requires a value.");
      }
      feature = next;
    } else if (value === "--operation" || value === "-o") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --operation option requires a value.");
      }
      operation = next;
    } else if (value === "--openapi-spec") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --openapi-spec option requires a value.");
      }
      openapiSpec = next;
    } else if (value.startsWith("--")) {
      throw new CliUsageError(`Unknown scaffold all option: ${value}.`);
    } else {
      positional.push(value);
    }
  }

  if (!feature && positional.length > 0) {
    feature = positional.shift() || "";
  }
  if (!operation && positional.length > 0) {
    operation = positional.shift() || "";
  }

  if (positional.length > 0) {
    throw new CliUsageError(`Unexpected extra argument: ${positional[0]}.`);
  }

  if (!feature) {
    throw new CliUsageError("Missing required option: --feature (-f).");
  }
  if (!operation) {
    throw new CliUsageError("Missing required option: --operation (-o).");
  }

  return { feature, operation, slice, kind, openapiSpec, dryRun, force };
}
