import { Router } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/files/file.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sharedContainer } from '../../infrastructure/di/index.js';
import { FileRepository, FolderRepository } from '../../infrastructure/repositories/files/index.js';
import { UploadFileUseCase } from '../../application/use-cases/index.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';
import { UserRepository } from '../../infrastructure/repositories/user/user.repository.js';

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

// Multer setup for memory storage (file buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 104857600, // 100MB default
  },
});

// Manual DI
const fileRepository = new FileRepository();
const folderRepository = new FolderRepository();
const userRepository = new UserRepository();
const storageService = new TierAwareStorageService();

const uploadFileUseCase = new UploadFileUseCase(
  fileRepository,
  folderRepository,
  storageService,
  userRepository
);

const fileController = new FileController(uploadFileUseCase);

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), (req, res) => fileController.upload(req, res));

export default router;
