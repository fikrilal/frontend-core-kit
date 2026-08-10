import {
  AuthEmailVerifyResponse,
  AuthEmailVerificationResendResponse,
  AuthLogoutResponse,
  AuthPasswordChangeResponse,
  AuthPasswordResetConfirmResponse,
  AuthPasswordResetRequestResponse,
  AuthPasswordRegisterResponse,
  AuthPasswordLoginResponse,
  AuthRefreshResponse,
  ChangePasswordRequestDto,
  LogoutRequestDto,
  PasswordResetRequestDto,
  PasswordResetConfirmRequestDto,
  PasswordLoginRequestDto,
  PasswordRegisterRequestDto,
  PatchMeRequestDto,
  RefreshRequestDto,
  VerifyEmailRequestDto,
  UsersMeGetResponse,
  UsersMePatchResponse,
  UsersMeSessionsListResponse,
  UsersMeAccountDeletionRequestResponse,
  UsersMeAccountDeletionCancelResponse,
  CreateProfileImageUploadRequestDto,
  UsersMeProfileImageUploadResponse,
  CompleteProfileImageUploadRequestDto,
  UsersMeProfileImageCompleteResponse,
  UsersMeProfileImageUrlResponse,
  UsersMeProfileImageClearResponse,
} from "../../src/contracts/example-api/runtime.generated.ts";

export const fixtureContracts = Object.freeze({
  loginRequest: PasswordLoginRequestDto,
  loginResponse: AuthPasswordLoginResponse,
  changePasswordRequest: ChangePasswordRequestDto,
  changePasswordResponse: AuthPasswordChangeResponse,
  registerRequest: PasswordRegisterRequestDto,
  registerResponse: AuthPasswordRegisterResponse,
  emailVerifyRequest: VerifyEmailRequestDto,
  emailVerifyResponse: AuthEmailVerifyResponse,
  emailVerificationResendResponse: AuthEmailVerificationResendResponse,
  resetRequest: PasswordResetRequestDto,
  resetResponse: AuthPasswordResetRequestResponse,
  resetConfirmRequest: PasswordResetConfirmRequestDto,
  resetConfirmResponse: AuthPasswordResetConfirmResponse,
  refreshRequest: RefreshRequestDto,
  refreshResponse: AuthRefreshResponse,
  logoutRequest: LogoutRequestDto,
  logoutResponse: AuthLogoutResponse,
  currentUserResponse: UsersMeGetResponse,
  patchMeRequest: PatchMeRequestDto,
  patchMeResponse: UsersMePatchResponse,
  sessionsListResponse: UsersMeSessionsListResponse,
  accountDeletionRequestResponse: UsersMeAccountDeletionRequestResponse,
  accountDeletionCancelResponse: UsersMeAccountDeletionCancelResponse,
  profileImageUploadRequest: CreateProfileImageUploadRequestDto,
  profileImageUploadResponse: UsersMeProfileImageUploadResponse,
  profileImageCompleteRequest: CompleteProfileImageUploadRequestDto,
  profileImageCompleteResponse: UsersMeProfileImageCompleteResponse,
  profileImageUrlResponse: UsersMeProfileImageUrlResponse,
  profileImageClearResponse: UsersMeProfileImageClearResponse,
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
