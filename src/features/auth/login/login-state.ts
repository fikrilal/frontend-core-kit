export type LoginError =
  | "invalidCredentials"
  | "userSuspended"
  | "rateLimited"
  | "invalidInput"
  | "unavailable";

export type LoginActionState = Readonly<{
  error: LoginError | null;
}>;
