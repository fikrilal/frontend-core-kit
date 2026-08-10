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

const apiConfigSchema = z.object({
  EXAMPLE_API_BASE_URL: apiBaseUrlSchema,
});

const sessionConfigSchema = z.object({
  LAMARA_SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(31_536_000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ApiConfig = Readonly<{
  apiBaseUrl: string;
}>;

export type SessionConfig = Readonly<{
  sessionTtlSeconds: number;
  secureCookies: boolean;
}>;

export function readApiConfig(
  environment: Record<string, string | undefined> = process.env,
): ApiConfig {
  const parsed = apiConfigSchema.parse(environment);

  return {
    apiBaseUrl: parsed.EXAMPLE_API_BASE_URL,
  };
}

export function readSessionConfig(
  environment: Record<string, string | undefined> = process.env,
): SessionConfig {
  const parsed = sessionConfigSchema.parse(environment);

  return {
    sessionTtlSeconds: parsed.LAMARA_SESSION_TTL_SECONDS,
    secureCookies: parsed.NODE_ENV === "production",
  };
}
