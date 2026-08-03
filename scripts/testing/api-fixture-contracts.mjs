import {
  AuthEmailVerifyResponse,
  AuthLogoutResponse,
  AuthPasswordResetConfirmResponse,
  AuthPasswordResetRequestResponse,
  AuthPasswordRegisterResponse,
  AuthPasswordLoginResponse,
  AuthRefreshResponse,
  LogoutRequestDto,
  PasswordResetRequestDto,
  PasswordResetConfirmRequestDto,
  PasswordLoginRequestDto,
  PasswordRegisterRequestDto,
  RefreshRequestDto,
  VerifyEmailRequestDto,
  UsersMeGetResponse,
} from "../../src/contracts/lamara-api/runtime.generated.ts";

export const fixtureContracts = Object.freeze({
  loginRequest: PasswordLoginRequestDto,
  loginResponse: AuthPasswordLoginResponse,
  registerRequest: PasswordRegisterRequestDto,
  registerResponse: AuthPasswordRegisterResponse,
  emailVerifyRequest: VerifyEmailRequestDto,
  emailVerifyResponse: AuthEmailVerifyResponse,
  resetRequest: PasswordResetRequestDto,
  resetResponse: AuthPasswordResetRequestResponse,
  resetConfirmRequest: PasswordResetConfirmRequestDto,
  resetConfirmResponse: AuthPasswordResetConfirmResponse,
  refreshRequest: RefreshRequestDto,
  refreshResponse: AuthRefreshResponse,
  logoutRequest: LogoutRequestDto,
  logoutResponse: AuthLogoutResponse,
  currentUserResponse: UsersMeGetResponse,
});

export function parseFixtureContract(boundary, schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Fixture contract violation at ${boundary}.`);
  }
  return result.data;
}

export function tryParseFixtureContract(schema, value) {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}
