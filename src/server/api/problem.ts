import { z } from "zod";

import type { ApiProblem } from "./result";

const problemSchema: z.ZodType<ApiProblem> = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  traceId: z.string().min(1),
});

export function parseApiProblem(
  value: unknown,
  responseStatus: number,
): ApiProblem | null {
  const parsed = problemSchema.safeParse(value);

  if (!parsed.success || parsed.data.status !== responseStatus) {
    return null;
  }

  return parsed.data;
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) {
    return undefined;
  }

  const seconds = Number(value);
  return Number.isSafeInteger(seconds) ? seconds : undefined;
}
