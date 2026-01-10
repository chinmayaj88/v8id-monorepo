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
import { ListFilesUseCase } from '../../application/use-cases/list-files.use-case';
import { UpdateFileUseCase } from '../../application/use-cases/update-file.use-case';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { ListFoldersUseCase } from '../../application/use-cases/list-folders.use-case';
import { FileRepository, FolderRepository } from '../../infrastructure/repositories';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { OciStorageService } from '../../infrastructure/oci';
import { authMiddleware } from '../middleware/auth.middleware';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { validateBody, validateQuery, createFolderSchema, updateFolderSchema, updateFileSchema, listFilesQuerySchema, listFoldersQuerySchema } from '../validators';

const router: IRouter = Router();

// Initialize repositories and services
const fileRepository = new FileRepository();
const folderRepository = new FolderRepository();
const userRepository = new UserRepository();
const deviceSessionRepository = new DeviceSessionRepository();
const jwtService = new JwtService();
const storageService = new OciStorageService();

// Initialize use cases
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
  fileRepository,
  userRepository,
  storageService
);
const listFilesUseCase = new ListFilesUseCase(fileRepository);
const updateFileUseCase = new UpdateFileUseCase(
  fileRepository,
  folderRepository
);
const createFolderUseCase = new CreateFolderUseCase(folderRepository);
const updateFolderUseCase = new UpdateFolderUseCase(folderRepository);
const deleteFolderUseCase = new DeleteFolderUseCase(
  folderRepository,
  fileRepository
);
const listFoldersUseCase = new ListFoldersUseCase(folderRepository);

// Initialize controller
const fileController = new FileController(
  uploadFileUseCase,
  downloadFileUseCase,
  deleteFileUseCase,
  listFilesUseCase,
  updateFileUseCase,
  createFolderUseCase,
  updateFolderUseCase,
  deleteFolderUseCase,
  listFoldersUseCase
);

// Configure multer for file uploads
// Store files in memory (buffer) since we upload directly to OCI
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (can be configured via env)
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now (can be restricted if needed)
    cb(null, true);
  },
});

// Authentication middleware for all routes
const authenticate = authMiddleware(userRepository, deviceSessionRepository, jwtService);

// File routes
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  (req, res) => fileController.upload(req as any, res)
);

router.get(
  '/:id/download',
  authenticate,
  (req, res) => fileController.download(req as any, res)
);

router.get(
  '/',
  authenticate,
  validateQuery(listFilesQuerySchema),
  (req, res) => fileController.list(req as any, res)
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
  '/folders',
  authenticate,
  validateQuery(listFoldersQuerySchema),
  (req, res) => fileController.listFolders(req as any, res)
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
