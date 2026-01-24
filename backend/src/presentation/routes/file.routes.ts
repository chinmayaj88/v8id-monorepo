/**
 * File Routes
 *
 * Express routes for file and folder operations.
 * Clean API structure with essential endpoints only.
 */

import { Router, type IRouter } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/file.controller.js';

// --- Use Cases Imports ---
import { ListFilesUseCase } from '../../application/use-cases/list-files.use-case.js';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case.js';
import { DownloadFileUseCase } from '../../application/use-cases/download-file.use-case.js';
import { DeleteFileUseCase } from '../../application/use-cases/delete-file.use-case.js';
import { PermanentDeleteFileUseCase } from '../../application/use-cases/permanent-delete-file.use-case.js';
import { RestoreFileUseCase } from '../../application/use-cases/restore-file.use-case.js';
import { GetFileUseCase } from '../../application/use-cases/get-file.use-case.js';
import { GetFolderUseCase } from '../../application/use-cases/get-folder.use-case.js';
import { UpdateFileUseCase } from '../../application/use-cases/update-file.use-case.js';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case.js';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case.js';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case.js';
import { PermanentDeleteFolderUseCase } from '../../application/use-cases/permanent-delete-folder.use-case.js';
import { RestoreFolderUseCase } from '../../application/use-cases/restore-folder.use-case.js';
import { ListFoldersUseCase } from '../../application/use-cases/list-folders.use-case.js';
import { GetFolderPathUseCase } from '../../application/use-cases/get-folder-path.use-case.js';
import { UnifiedSearchUseCase } from '../../application/use-cases/unified-search.use-case.js';
import { InitiateUploadUseCase } from '../../application/use-cases/initiate-upload.use-case.js';
import { ChunkUploadUseCase } from '../../application/use-cases/chunk-upload.use-case.js';
import { ResumeUploadUseCase } from '../../application/use-cases/resume-upload.use-case.js';
import { CompleteUploadUseCase } from '../../application/use-cases/complete-upload.use-case.js';
import { CancelUploadUseCase } from '../../application/use-cases/cancel-upload.use-case.js';
import { ShareByEmailUseCase } from '../../application/use-cases/share-by-email.use-case.js';
import { ListSharedFilesUseCase } from '../../application/use-cases/list-shared-files.use-case.js';
import { UnshareFileUseCase } from '../../application/use-cases/unshare-file.use-case.js';
import { SearchUsersUseCase } from '../../application/use-cases/search-users.use-case.js';
import { PreviewFileUseCase } from '../../application/use-cases/preview-file.use-case.js';

// --- Infrastructure Imports ---
import {
  FileRepository,
  FolderRepository,
  UploadSessionRepository,
  FileShareRepository,
} from '../../infrastructure/repositories/index.js';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository.js';
import { TierAwareStorageService } from '../../infrastructure/oci/index.js';
import { JwtService } from '../../infrastructure/services/jwt.service.js';
import { ThumbnailService } from '../../infrastructure/services/thumbnail.service.js';
import { UrlCacheService } from '../../infrastructure/services/url-cache.service.js';
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service.js';

// --- Middleware & Validator Imports ---
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  createFolderSchema,
  listFilesQuerySchema,
  validateBody,
  validateQuery,
} from '../validators/index.js';

const router: IRouter = Router();

// --- Instantiation ---
// 1. Repositories
const fileRepository = new FileRepository();
const folderRepository = new FolderRepository();
const userRepository = new UserRepository();
const deviceSessionRepository = new DeviceSessionRepository();
const uploadSessionRepository = new UploadSessionRepository();
const fileShareRepository = new FileShareRepository();

// 2. Services
const jwtService = new JwtService();
const storageService = new TierAwareStorageService();
const thumbnailService = new ThumbnailService();
const urlCache = new UrlCacheService(72000);
urlCache.startCleanup(300);
const storageCache = new StorageCacheService(60);
storageCache.startCleanup(300);

// 3. Use Cases

// File Operations
const listFilesUseCase = new ListFilesUseCase(
  fileRepository,
  folderRepository,
  storageService,
  urlCache
);

const uploadFileUseCase = new UploadFileUseCase(
  fileRepository,
  folderRepository,
  userRepository,
  storageService,
  thumbnailService,
  storageCache
);

const downloadFileUseCase = new DownloadFileUseCase(fileRepository, storageService);
const deleteFileUseCase = new DeleteFileUseCase(fileRepository);
const permanentDeleteFileUseCase = new PermanentDeleteFileUseCase(
  fileRepository,
  userRepository,
  storageService,
  storageCache
);
const restoreFileUseCase = new RestoreFileUseCase(fileRepository, userRepository, storageCache);
const getFileUseCase = new GetFileUseCase(fileRepository, storageService, urlCache);
const updateFileUseCase = new UpdateFileUseCase(fileRepository, folderRepository);
const previewFileUseCase = new PreviewFileUseCase(
  fileRepository,
  storageService,
  fileShareRepository,
  urlCache
);

// Folder Operations
const getFolderUseCase = new GetFolderUseCase(folderRepository);
const createFolderUseCase = new CreateFolderUseCase(folderRepository);
const updateFolderUseCase = new UpdateFolderUseCase(folderRepository);
const deleteFolderUseCase = new DeleteFolderUseCase(folderRepository);
const permanentDeleteFolderUseCase = new PermanentDeleteFolderUseCase(
  folderRepository,
  fileRepository,
  storageService,
  userRepository,
  storageCache
);
const restoreFolderUseCase = new RestoreFolderUseCase(folderRepository);
const listFoldersUseCase = new ListFoldersUseCase(folderRepository);
const getFolderPathUseCase = new GetFolderPathUseCase(folderRepository);

// Chunked Upload
const initiateUploadUseCase = new InitiateUploadUseCase(
  uploadSessionRepository,
  userRepository,
  folderRepository,
  storageService
);
const chunkUploadUseCase = new ChunkUploadUseCase(uploadSessionRepository, storageService);
const resumeUploadUseCase = new ResumeUploadUseCase(uploadSessionRepository, storageService);
const completeUploadUseCase = new CompleteUploadUseCase(
  uploadSessionRepository,
  fileRepository,
  folderRepository,
  userRepository,
  storageService,
  thumbnailService,
  storageCache
);
const cancelUploadUseCase = new CancelUploadUseCase(uploadSessionRepository, storageService);

// Search
const unifiedSearchUseCase = new UnifiedSearchUseCase(
  fileRepository,
  folderRepository,
  storageService,
  urlCache
);

// Sharing
const shareByEmailUseCase = new ShareByEmailUseCase(
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
const searchUsersUseCase = new SearchUsersUseCase(userRepository);

// --- Controller Instantiation ---
const fileController = new FileController(
  uploadFileUseCase,
  initiateUploadUseCase,
  chunkUploadUseCase,
  resumeUploadUseCase,
  completeUploadUseCase,
  cancelUploadUseCase,
  downloadFileUseCase,
  deleteFileUseCase,
  permanentDeleteFileUseCase,
  restoreFileUseCase,
  getFileUseCase,
  getFolderUseCase,
  shareByEmailUseCase,
  listSharedFilesUseCase,
  unshareFileUseCase,
  previewFileUseCase,
  listFilesUseCase,
  updateFileUseCase,
  createFolderUseCase,
  updateFolderUseCase,
  deleteFolderUseCase,
  permanentDeleteFolderUseCase,
  restoreFolderUseCase,
  listFoldersUseCase,
  unifiedSearchUseCase,
  getFolderPathUseCase,
  searchUsersUseCase
);

// --- Middleware Setup ---
const authenticate = authMiddleware(userRepository, deviceSessionRepository, jwtService);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for single upload
  },
});

// ==========================================
// ROUTES
// ==========================================

// --- File Upload ---
// Single file upload (up to 100MB)
router.post('/upload', authenticate, upload.single('file'), (req, res) =>
  fileController.upload(req as any, res)
);

// Multiple files upload
router.post('/upload-multiple', authenticate, upload.array('files', 10), (req, res) =>
  fileController.uploadMultiple(req as any, res)
);

// --- Chunked Upload (up to 5GB) ---
// Initiate chunked upload
router.post('/upload/initiate', authenticate, (req, res) =>
  fileController.initiateUpload(req as any, res)
);

// Upload a chunk
router.post('/upload/chunk/:sessionId', authenticate, upload.single('chunk'), (req, res) =>
  fileController.uploadChunk(req as any, res)
);

// Get upload progress for resume
router.get('/upload/:sessionId/resume', authenticate, (req, res) =>
  fileController.resumeUpload(req as any, res)
);

// Complete chunked upload
router.post('/upload/:sessionId/complete', authenticate, (req, res) =>
  fileController.completeUpload(req as any, res)
);

// Cancel chunked upload
router.delete('/upload/:sessionId/cancel', authenticate, (req, res) =>
  fileController.cancelUpload(req as any, res)
);

// --- File/Folder Listing ---
// List files and folders with filters
router.get('/', authenticate, validateQuery(listFilesQuerySchema), (req, res) =>
  fileController.list(req as any, res)
);

// Universal search
router.get('/search', authenticate, (req, res) => fileController.search(req as any, res));

// List trash (deleted files and folders)
router.get('/trash', authenticate, (req, res) => fileController.listTrash(req as any, res));

// --- File Operations ---
// Get file details
router.get('/:id', authenticate, (req, res) => fileController.getById(req as any, res));

// Download file (returns presigned URL)
router.get('/:id/download', authenticate, (req, res) => fileController.download(req as any, res));

// Preview file (for inline viewing)
router.get('/:id/preview', authenticate, (req, res) => fileController.preview(req as any, res));

// Update file metadata
router.patch('/:id', authenticate, (req, res) => fileController.update(req as any, res));

// Soft delete file (move to trash)
router.delete('/:id', authenticate, (req, res) => fileController.delete(req as any, res));

// Permanent delete file
router.delete('/:id/permanent', authenticate, (req, res) =>
  fileController.permanentDelete(req as any, res)
);

// Restore file from trash
router.post('/:id/restore', authenticate, (req, res) => fileController.restore(req as any, res));

// --- Folder Operations ---
// Create folder
router.post('/folders', authenticate, validateBody(createFolderSchema), (req, res) =>
  fileController.createFolder(req as any, res)
);

// Get folder contents
router.get('/folders/:id/contents', authenticate, (req, res) =>
  fileController.getFolderContents(req as any, res)
);

// Get folder path (breadcrumbs)
router.get('/folders/:id/path', authenticate, (req, res) =>
  fileController.getFolderPath(req as any, res)
);

// Update folder
router.patch('/folders/:id', authenticate, (req, res) =>
  fileController.updateFolder(req as any, res)
);

// Soft delete folder
router.delete('/folders/:id', authenticate, (req, res) =>
  fileController.deleteFolder(req as any, res)
);

// Permanent delete folder
router.delete('/folders/:id/permanent', authenticate, (req, res) =>
  fileController.permanentDeleteFolder(req as any, res)
);

// Restore folder from trash
router.post('/folders/:id/restore', authenticate, (req, res) =>
  fileController.restoreFolder(req as any, res)
);

// --- Sharing ---
// Search users for sharing
router.get('/users/search', authenticate, (req, res) =>
  fileController.searchUsers(req as any, res)
);

// Share file/folder with user by email
router.post('/share', authenticate, (req, res) => fileController.shareByEmail(req as any, res));

// List my shared files/folders
router.get('/shares', authenticate, (req, res) => fileController.listShares(req as any, res));

// List files/folders shared with me
router.get('/shared-with-me', authenticate, (req, res) =>
  fileController.listSharedWithMe(req as any, res)
);

// Remove share
router.delete('/shares/:shareId', authenticate, (req, res) =>
  fileController.removeShare(req as any, res)
);

export default router;
