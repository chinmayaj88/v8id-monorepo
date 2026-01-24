/**
 * Application Use Cases
 *
 * Use cases represent the application's business logic.
 * Each use case handles a specific business operation.
 */

export {
  VerifyCredentialsUseCase,
  type VerifyCredentialsResult,
} from './verify-credentials.use-case.js';
export {
  VerifyTotpLoginUseCase,
  type VerifyTotpLoginResult,
  type VerifyTotpLoginDTO,
} from './verify-totp-login.use-case.js';
export { CreateUserUseCase, type CreateUserResult } from './create-user.use-case.js';
export { RefreshTokenUseCase, type RefreshTokenResult } from './refresh-token.use-case.js';
export { LogoutUseCase } from './logout.use-case.js';
export { ForgotPasswordUseCase } from './forgot-password.use-case.js';
export { ResetPasswordUseCase } from './reset-password.use-case.js';
export { ChangePasswordUseCase, type ChangePasswordDTO } from './change-password.use-case.js';
export { GetBackupCodesUseCase, type GetBackupCodesResult } from './get-backup-codes.use-case.js';
export {
  GetLoginHistoryUseCase,
  type GetLoginHistoryResult,
  type GetLoginHistoryDTO,
} from './get-login-history.use-case.js';
export {
  SearchUsersUseCase,
  type SearchUsersDTO,
  type SearchUsersResult,
  type UserSearchResult,
} from './search-users.use-case.js';
export { RegenerateBackupCodesUseCase } from './regenerate-backup-codes.use-case.js';
export { ResetupTotpUseCase } from './resetup-totp.use-case.js';
export { UpdateUserProfileUseCase } from './update-user-profile.use-case.js';
