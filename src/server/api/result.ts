export type ApiProblem = Readonly<{
  type: string;
  title: string;
  status: number;
  code: string;
  traceId: string;
}>;

export type ApiFailure =
  | Readonly<{
      kind: "problem";
      problem: ApiProblem;
      retryAfterSeconds?: number;
    }>
  | Readonly<{
      kind: "network";
      message: string;
    }>
  | Readonly<{
      kind: "timeout";
      outcome: "unknown";
      message: string;
    }>
  | Readonly<{
      kind: "cancelled";
      message: string;
    }>
  | Readonly<{
      kind: "invalid-response";
      message: string;
    }>;

export type ApiResult<T, TMeta = unknown> =
  | Readonly<{
      ok: true;
      data: T;
      meta?: TMeta;
      status: number;
      traceId: string;
    }>
  | Readonly<{
      ok: false;
      failure: ApiFailure;
      status: number | null;
      traceId: string;
    }>;
