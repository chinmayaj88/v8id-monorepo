import { Router } from 'express';
import { FolderController } from '../controllers/files/folder.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sharedContainer } from '../../infrastructure/di/index.js';
import { FolderRepository, FileRepository } from '../../infrastructure/repositories/files/index.js';
import {
  CreateFolderUseCase,
  ListFolderContentsUseCase,
} from '../../application/use-cases/index.js';

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

// Manual DI for now (should be moved to container)
const folderRepository = new FolderRepository();
const fileRepository = new FileRepository();

const createFolderUseCase = new CreateFolderUseCase(folderRepository);
const listFolderContentsUseCase = new ListFolderContentsUseCase(folderRepository, fileRepository);

const folderController = new FolderController(createFolderUseCase, listFolderContentsUseCase);

const router = Router();

router.use(authenticate);

router.post('/', (req, res) => folderController.create(req, res));
router.get('/', (req, res) => folderController.list(req, res));

export default router;
