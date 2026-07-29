import "server-only";

import { z } from "zod";

const apiBaseUrlSchema = z
  .string()
  .trim()
  .pipe(z.url())
  .superRefine((value, context) => {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message: "must use http or https",
      });
    }
    if (url.username || url.password) {
      context.addIssue({
        code: "custom",
        message: "must not contain credentials",
      });
    }
    if (url.pathname !== "/") {
      context.addIssue({
        code: "custom",
        message: "must be an origin without a path",
      });
    }
    if (url.search || url.hash) {
      context.addIssue({
        code: "custom",
        message: "must not contain a query string or fragment",
      });
    }
  })
  .transform((value) => new URL(value).origin);

const serverConfigSchema = z.object({
  LAMARA_API_BASE_URL: apiBaseUrlSchema,
});

export type ServerConfig = Readonly<{
  apiBaseUrl: string;
}>;

export function readServerConfig(
  environment: Record<string, string | undefined> = process.env,
): ServerConfig {
  const parsed = serverConfigSchema.parse(environment);

  return {
    apiBaseUrl: parsed.LAMARA_API_BASE_URL,
  };
}
