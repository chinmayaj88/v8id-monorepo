/**
 * File Routes
 * 
 * Express routes for file and folder operations.
 */

import { Router, type IRouter } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/file.controller';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { DownloadFileUseCase } from '../../application/use-cases/download-file.use-case';
import { DeleteFileUseCase } from '../../application/use-cases/delete-file.use-case';
import { PermanentDeleteFileUseCase } from '../../application/use-cases/permanent-delete-file.use-case';
import { RestoreFileUseCase } from '../../application/use-cases/restore-file.use-case';
import { ArchiveFileUseCase } from '../../application/use-cases/archive-file.use-case';
import { GetFileUseCase } from '../../application/use-cases/get-file.use-case';
import { GetFolderUseCase } from '../../application/use-cases/get-folder.use-case';
import { ShareFileUseCase } from '../../application/use-cases/share-file.use-case';
import { ListSharedFilesUseCase } from '../../application/use-cases/list-shared-files.use-case';
import { UnshareFileUseCase } from '../../application/use-cases/unshare-file.use-case';
import { BulkDeleteFilesUseCase } from '../../application/use-cases/bulk-delete-files.use-case';
import { BulkMoveFilesUseCase } from '../../application/use-cases/bulk-move-files.use-case';
import { BulkRestoreFilesUseCase } from '../../application/use-cases/bulk-restore-files.use-case';
import { CopyFileUseCase } from '../../application/use-cases/copy-file.use-case';
import { CopyFolderUseCase } from '../../application/use-cases/copy-folder.use-case';
import { StorageAnalyticsUseCase } from '../../application/use-cases/storage-analytics.use-case';
import { PreviewFileUseCase } from '../../application/use-cases/preview-file.use-case';
import { ToggleFavoriteUseCase } from '../../application/use-cases/toggle-favorite.use-case';
import { ListFavoritesUseCase } from '../../application/use-cases/list-favorites.use-case';
import { CreateFileCommentUseCase } from '../../application/use-cases/create-file-comment.use-case';
import { ListFileCommentsUseCase } from '../../application/use-cases/list-file-comments.use-case';
import { SetFileExpirationUseCase } from '../../application/use-cases/set-file-expiration.use-case';
import { GenerateFileLinkUseCase } from '../../application/use-cases/generate-file-link.use-case';
import { ListFileVersionsUseCase } from '../../application/use-cases/list-file-versions.use-case';
import { CreateFileVersionUseCase } from '../../application/use-cases/create-file-version.use-case';
import { RestoreFileVersionUseCase } from '../../application/use-cases/restore-file-version.use-case';
import { CreateFolderTemplateUseCase } from '../../application/use-cases/create-folder-template.use-case';
import { CreateFolderFromTemplateUseCase } from '../../application/use-cases/create-folder-from-template.use-case';
import { ListFolderTemplatesUseCase } from '../../application/use-cases/list-folder-templates.use-case';
import { GetFileActivityUseCase } from '../../application/use-cases/get-file-activity.use-case';
import { InitiateUploadUseCase } from '../../application/use-cases/initiate-upload.use-case';
import { ChunkUploadUseCase } from '../../application/use-cases/chunk-upload.use-case';
import { ResumeUploadUseCase } from '../../application/use-cases/resume-upload.use-case';
import { CompleteUploadUseCase } from '../../application/use-cases/complete-upload.use-case';
import { ListFilesUseCase } from '../../application/use-cases/list-files.use-case';
import { UpdateFileUseCase } from '../../application/use-cases/update-file.use-case';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { PermanentDeleteFolderUseCase } from '../../application/use-cases/permanent-delete-folder.use-case';
import { RestoreFolderUseCase } from '../../application/use-cases/restore-folder.use-case';
import { ListFoldersUseCase } from '../../application/use-cases/list-folders.use-case';
import { FileRepository, FolderRepository, UploadSessionRepository, FileShareRepository } from '../../infrastructure/repositories';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { OciStorageService } from '../../infrastructure/oci';
import { authMiddleware } from '../middleware/auth.middleware';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { validateBody, validateQuery, createFolderSchema, updateFolderSchema, updateFileSchema, listFilesQuerySchema, listFoldersQuerySchema, initiateUploadSchema, chunkUploadSchema, completeUploadSchema } from '../validators';

const router: IRouter = Router();

const fileRepository = new FileRepository();
const folderRepository = new FolderRepository();
const uploadSessionRepository = new UploadSessionRepository();
const fileShareRepository = new FileShareRepository();
const userRepository = new UserRepository();
const deviceSessionRepository = new DeviceSessionRepository();
const jwtService = new JwtService();
const storageService = new OciStorageService();

const uploadFileUseCase = new UploadFileUseCase(
  fileRepository,
  folderRepository,
  userRepository,
  storageService
);
const downloadFileUseCase = new DownloadFileUseCase(
  fileRepository,
  storageService
);
const deleteFileUseCase = new DeleteFileUseCase(
  fileRepository
);
const permanentDeleteFileUseCase = new PermanentDeleteFileUseCase(
  fileRepository,
  userRepository,
  storageService
);
const restoreFileUseCase = new RestoreFileUseCase(
  fileRepository,
  userRepository
);
const archiveFileUseCase = new ArchiveFileUseCase(fileRepository);
const getFileUseCase = new GetFileUseCase(fileRepository);
const getFolderUseCase = new GetFolderUseCase(folderRepository);
const shareFileUseCase = new ShareFileUseCase(
  fileShareRepository,
  fileRepository,
  folderRepository,
  userRepository
);
const listSharedFilesUseCase = new ListSharedFilesUseCase(
  fileShareRepository,
  fileRepository,
  folderRepository
);
const unshareFileUseCase = new UnshareFileUseCase(fileShareRepository);
const bulkDeleteFilesUseCase = new BulkDeleteFilesUseCase(fileRepository, deleteFileUseCase);
const bulkRestoreFilesUseCase = new BulkRestoreFilesUseCase(fileRepository, restoreFileUseCase);
const listFilesUseCase = new ListFilesUseCase(fileRepository);
const updateFileUseCase = new UpdateFileUseCase(
  fileRepository,
  folderRepository
);
const createFolderUseCase = new CreateFolderUseCase(folderRepository);
const bulkMoveFilesUseCase = new BulkMoveFilesUseCase(
  fileRepository,
  folderRepository,
  updateFileUseCase
);
const copyFileUseCase = new CopyFileUseCase(
  fileRepository,
  folderRepository,
  storageService,
  userRepository
);
const copyFolderUseCase = new CopyFolderUseCase(
  folderRepository,
  fileRepository,
  userRepository,
  createFolderUseCase,
  copyFileUseCase
);
const storageAnalyticsUseCase = new StorageAnalyticsUseCase(
  fileRepository,
  folderRepository,
  userRepository
);
const previewFileUseCase = new PreviewFileUseCase(
  fileRepository,
  storageService,
  fileShareRepository
);
const toggleFavoriteUseCase = new ToggleFavoriteUseCase(fileRepository, folderRepository);
const listFavoritesUseCase = new ListFavoritesUseCase(fileRepository, folderRepository);
const createFileCommentUseCase = new CreateFileCommentUseCase(fileRepository, folderRepository);
const listFileCommentsUseCase = new ListFileCommentsUseCase();
const setFileExpirationUseCase = new SetFileExpirationUseCase(fileRepository);
const generateFileLinkUseCase = new GenerateFileLinkUseCase(
  fileRepository,
  folderRepository,
  storageService
);
const listFileVersionsUseCase = new ListFileVersionsUseCase(fileRepository);
const createFileVersionUseCase = new CreateFileVersionUseCase(fileRepository, storageService);
const restoreFileVersionUseCase = new RestoreFileVersionUseCase(
  fileRepository,
  storageService,
  createFileVersionUseCase
);
const createFolderTemplateUseCase = new CreateFolderTemplateUseCase(
  folderRepository,
  fileRepository
);
const createFolderFromTemplateUseCase = new CreateFolderFromTemplateUseCase(
  folderRepository,
  createFolderUseCase
);
const listFolderTemplatesUseCase = new ListFolderTemplatesUseCase();
const getFileActivityUseCase = new GetFileActivityUseCase(fileRepository);
const initiateUploadUseCase = new InitiateUploadUseCase(
  uploadSessionRepository,
  userRepository,
  folderRepository,
  storageService
);
const chunkUploadUseCase = new ChunkUploadUseCase(
  uploadSessionRepository,
  storageService
);
const resumeUploadUseCase = new ResumeUploadUseCase(
  uploadSessionRepository,
  storageService
);
const completeUploadUseCase = new CompleteUploadUseCase(
  uploadSessionRepository,
  fileRepository,
  folderRepository,
  userRepository,
  storageService
);
const updateFolderUseCase = new UpdateFolderUseCase(folderRepository);
const deleteFolderUseCase = new DeleteFolderUseCase(folderRepository);
const permanentDeleteFolderUseCase = new PermanentDeleteFolderUseCase(
  folderRepository,
  fileRepository,
  storageService,
  userRepository
);
const restoreFolderUseCase = new RestoreFolderUseCase(folderRepository);
const listFoldersUseCase = new ListFoldersUseCase(folderRepository);

const fileController = new FileController(
  uploadFileUseCase,
  initiateUploadUseCase,
  chunkUploadUseCase,
  resumeUploadUseCase,
  completeUploadUseCase,
  downloadFileUseCase,
  deleteFileUseCase,
  permanentDeleteFileUseCase,
  restoreFileUseCase,
  archiveFileUseCase,
  getFileUseCase,
  getFolderUseCase,
  shareFileUseCase,
  listSharedFilesUseCase,
  unshareFileUseCase,
  bulkDeleteFilesUseCase,
  bulkMoveFilesUseCase,
  bulkRestoreFilesUseCase,
  copyFileUseCase,
  copyFolderUseCase,
  storageAnalyticsUseCase,
  previewFileUseCase,
  toggleFavoriteUseCase,
  listFavoritesUseCase,
  createFileCommentUseCase,
  listFileCommentsUseCase,
  setFileExpirationUseCase,
  generateFileLinkUseCase,
  listFileVersionsUseCase,
  restoreFileVersionUseCase,
  createFolderTemplateUseCase,
  createFolderFromTemplateUseCase,
  listFolderTemplatesUseCase,
  getFileActivityUseCase,
  listFilesUseCase,
  updateFileUseCase,
  createFolderUseCase,
  updateFolderUseCase,
  deleteFolderUseCase,
  permanentDeleteFolderUseCase,
  restoreFolderUseCase,
  listFoldersUseCase,
  createFileVersionUseCase
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, _file, cb) => {
    cb(null, true);
  },
});

const authenticate = authMiddleware(userRepository, deviceSessionRepository, jwtService);

router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  (req, res) => fileController.upload(req as any, res)
);

// Large file upload (chunked/resumable)
router.post(
  '/upload/initiate',
  authenticate,
  validateBody(initiateUploadSchema),
  (req, res) => fileController.initiateUpload(req as any, res)
);

router.post(
  '/upload/chunk',
  authenticate,
  upload.single('chunk'),
  validateBody(chunkUploadSchema),
  (req, res) => fileController.uploadChunk(req as any, res)
);

router.get(
  '/upload/:sessionId/resume',
  authenticate,
  (req, res) => fileController.resumeUpload(req as any, res)
);

router.post(
  '/upload/:sessionId/complete',
  authenticate,
  validateBody(completeUploadSchema),
  (req, res) => fileController.completeUpload(req as any, res)
);

// Specific routes before generic :id routes (order matters in Express)
router.get(
  '/:id/download',
  authenticate,
  (req, res) => fileController.download(req as any, res)
);

router.post(
  '/:id/restore',
  authenticate,
  (req, res) => fileController.restore(req as any, res)
);

router.post(
  '/:id/archive',
  authenticate,
  (req, res) => fileController.archive(req as any, res)
);

router.post(
  '/:id/share',
  authenticate,
  (req, res) => fileController.share(req as any, res)
);

router.get(
  '/shared',
  authenticate,
  (req, res) => fileController.listShared(req as any, res)
);

router.delete(
  '/shares/:shareId',
  authenticate,
  (req, res) => fileController.unshare(req as any, res)
);

router.post(
  '/bulk/delete',
  authenticate,
  (req, res) => fileController.bulkDelete(req as any, res)
);

router.post(
  '/bulk/move',
  authenticate,
  (req, res) => fileController.bulkMove(req as any, res)
);

router.post(
  '/bulk/restore',
  authenticate,
  (req, res) => fileController.bulkRestore(req as any, res)
);

router.post(
  '/:id/copy',
  authenticate,
  (req, res) => fileController.copyFile(req as any, res)
);

router.get(
  '/analytics',
  authenticate,
  (req, res) => fileController.getStorageAnalytics(req as any, res)
);

router.get(
  '/:id/preview',
  authenticate,
  (req, res) => fileController.preview(req as any, res)
);

router.post(
  '/:id/favorite',
  authenticate,
  (req, res) => fileController.toggleFavorite(req as any, res)
);

router.get(
  '/favorites',
  authenticate,
  (req, res) => fileController.listFavorites(req as any, res)
);

router.post(
  '/:id/comments',
  authenticate,
  (req, res) => fileController.createComment(req as any, res)
);

router.get(
  '/:id/comments',
  authenticate,
  (req, res) => fileController.listComments(req as any, res)
);

router.post(
  '/:id/expiration',
  authenticate,
  (req, res) => fileController.setExpiration(req as any, res)
);

router.post(
  '/:id/link',
  authenticate,
  (req, res) => fileController.generateLink(req as any, res)
);

router.get(
  '/:id/versions',
  authenticate,
  (req, res) => fileController.listVersions(req as any, res)
);

router.post(
  '/:id/versions/:versionId/restore',
  authenticate,
  (req, res) => fileController.restoreVersion(req as any, res)
);

router.get(
  '/:id/activity',
  authenticate,
  (req, res) => fileController.getActivity(req as any, res)
);

router.delete(
  '/:id/permanent',
  authenticate,
  (req, res) => fileController.permanentDelete(req as any, res)
);

router.get(
  '/trash',
  authenticate,
  validateQuery(listFilesQuerySchema),
  (req, res) => fileController.listTrash(req as any, res)
);

router.get(
  '/',
  authenticate,
  validateQuery(listFilesQuerySchema),
  (req, res) => fileController.list(req as any, res)
);

router.get(
  '/:id',
  authenticate,
  (req, res) => fileController.getById(req as any, res)
);

router.patch(
  '/:id',
  authenticate,
  validateBody(updateFileSchema),
  (req, res) => fileController.update(req as any, res)
);

router.delete(
  '/:id',
  authenticate,
  (req, res) => fileController.delete(req as any, res)
);

// Folder routes
router.post(
  '/folders',
  authenticate,
  validateBody(createFolderSchema),
  (req, res) => fileController.createFolder(req as any, res)
);

router.get(
  '/folders/trash',
  authenticate,
  validateQuery(listFoldersQuerySchema),
  (req, res) => fileController.listTrashFolders(req as any, res)
);

router.get(
  '/folders',
  authenticate,
  validateQuery(listFoldersQuerySchema),
  (req, res) => fileController.listFolders(req as any, res)
);

router.get(
  '/folders/:id',
  authenticate,
  (req, res) => fileController.getFolderById(req as any, res)
);

// Specific routes before generic :id routes (order matters in Express)
router.post(
  '/folders/:id/restore',
  authenticate,
  (req, res) => fileController.restoreFolder(req as any, res)
);

router.delete(
  '/folders/:id/permanent',
  authenticate,
  (req, res) => fileController.permanentDeleteFolder(req as any, res)
);

router.post(
  '/folders/:id/share',
  authenticate,
  (req, res) => fileController.shareFolder(req as any, res)
);

router.post(
  '/folders/:id/copy',
  authenticate,
  (req, res) => fileController.copyFolder(req as any, res)
);

router.post(
  '/folders/templates',
  authenticate,
  (req, res) => fileController.createTemplate(req as any, res)
);

router.get(
  '/folders/templates',
  authenticate,
  (req, res) => fileController.listTemplates(req as any, res)
);

router.post(
  '/folders/templates/:templateId/create',
  authenticate,
  (req, res) => fileController.createFromTemplate(req as any, res)
);

router.patch(
  '/folders/:id',
  authenticate,
  validateBody(updateFolderSchema),
  (req, res) => fileController.updateFolder(req as any, res)
);

router.delete(
  '/folders/:id',
  authenticate,
  (req, res) => fileController.deleteFolder(req as any, res)
);

export default router;
