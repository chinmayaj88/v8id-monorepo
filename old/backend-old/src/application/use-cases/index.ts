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
export { UploadFileUseCase, type UploadFileResult } from './upload-file.use-case.js';
export { InitiateUploadUseCase, type InitiateUploadResult } from './initiate-upload.use-case.js';
export { ChunkUploadUseCase, type ChunkUploadResult } from './chunk-upload.use-case.js';
export { ResumeUploadUseCase, type ResumeUploadResult } from './resume-upload.use-case.js';
export { CompleteUploadUseCase } from './complete-upload.use-case.js';
export { DownloadFileUseCase, type DownloadFileResult } from './download-file.use-case.js';
export { DeleteFileUseCase } from './delete-file.use-case.js';
export { PermanentDeleteFileUseCase } from './permanent-delete-file.use-case.js';
export { RestoreFileUseCase } from './restore-file.use-case.js';
export { ArchiveFileUseCase } from './archive-file.use-case.js';
export { GetFileUseCase } from './get-file.use-case.js';
export { GetFolderUseCase } from './get-folder.use-case.js';
export { ShareFileUseCase, type ShareFileDTO } from './share-file.use-case.js';
export {
  ListSharedFilesUseCase,
  type ListSharedFilesResult,
} from './list-shared-files.use-case.js';
export { UnshareFileUseCase } from './unshare-file.use-case.js';
export { BulkDeleteFilesUseCase, type BulkDeleteFilesDTO } from './bulk-delete-files.use-case.js';
export { BulkMoveFilesUseCase, type BulkMoveFilesDTO } from './bulk-move-files.use-case.js';
export {
  BulkRestoreFilesUseCase,
  type BulkRestoreFilesDTO,
} from './bulk-restore-files.use-case.js';
export { CopyFileUseCase, type CopyFileDTO } from './copy-file.use-case.js';
export { CopyFolderUseCase, type CopyFolderDTO } from './copy-folder.use-case.js';
export {
  StorageAnalyticsUseCase,
  type StorageAnalyticsResult,
} from './storage-analytics.use-case.js';
export { PreviewFileUseCase, type PreviewFileResult } from './preview-file.use-case.js';
export {
  ToggleFavoriteUseCase,
  type ToggleFavoriteDTO,
  type ToggleFavoriteResult,
} from './toggle-favorite.use-case.js';
export { ListFavoritesUseCase, type ListFavoritesResult } from './list-favorites.use-case.js';
export {
  CreateFileCommentUseCase,
  type CreateFileCommentDTO,
  type FileCommentResponse,
} from './create-file-comment.use-case.js';
export {
  ListFileCommentsUseCase,
  type ListFileCommentsResult,
  type FileCommentResponse as FileCommentResponseList,
} from './list-file-comments.use-case.js';
export {
  SetFileExpirationUseCase,
  type SetFileExpirationDTO,
} from './set-file-expiration.use-case.js';
export {
  AutoDeleteExpiredFilesUseCase,
  type AutoDeleteResult,
} from './auto-delete-expired-files.use-case.js';
export {
  GenerateFileLinkUseCase,
  type GenerateFileLinkDTO,
  type FileLinkResponse,
} from './generate-file-link.use-case.js';
export {
  CreateFolderTemplateUseCase,
  type CreateFolderTemplateDTO,
  type FolderTemplateResponse,
} from './create-folder-template.use-case.js';
export {
  CreateFolderFromTemplateUseCase,
  type CreateFolderFromTemplateDTO,
} from './create-folder-from-template.use-case.js';
export {
  ListFolderTemplatesUseCase,
  type ListFolderTemplatesResult,
} from './list-folder-templates.use-case.js';
export {
  GetFileActivityUseCase,
  type GetFileActivityResult,
  type FileActivityResponse,
} from './get-file-activity.use-case.js';
export { ListFilesUseCase, type ListFilesResult } from './list-files.use-case.js';
export { UpdateFileUseCase } from './update-file.use-case.js';
export { CreateFolderUseCase } from './create-folder.use-case.js';
export { UpdateFolderUseCase } from './update-folder.use-case.js';
export { DeleteFolderUseCase } from './delete-folder.use-case.js';
export { PermanentDeleteFolderUseCase } from './permanent-delete-folder.use-case.js';
export { RestoreFolderUseCase } from './restore-folder.use-case.js';
export { ListFoldersUseCase, type ListFoldersResult } from './list-folders.use-case.js';
export {
  GenerateThumbnailUseCase,
  type GenerateThumbnailResult,
} from './generate-thumbnail.use-case.js';
export {
  RegenerateThumbnailUseCase,
  type RegenerateThumbnailResult,
} from './regenerate-thumbnail.use-case.js';
export { GetBackupCodesUseCase, type GetBackupCodesResult } from './get-backup-codes.use-case.js';
export {
  GetLoginHistoryUseCase,
  type GetLoginHistoryResult,
  type GetLoginHistoryDTO,
} from './get-login-history.use-case.js';

// New use cases
export { CancelUploadUseCase, type CancelUploadResult } from './cancel-upload.use-case.js';
export {
  SearchUsersUseCase,
  type SearchUsersDTO,
  type SearchUsersResult,
  type UserSearchResult,
} from './search-users.use-case.js';
export { ShareByEmailUseCase, type ShareByEmailDTO } from './share-by-email.use-case.js';
export {
  UploadFolderUseCase,
  type UploadFolderDTO,
  type UploadFolderResult,
  type FolderUploadFileDTO,
} from './upload-folder.use-case.js';
