import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sharedContainer } from '../../infrastructure/di/index.js';
import { FolderRepository, FileRepository } from '../../infrastructure/repositories/files/index.js';
import { SearchFilesUseCase } from '../../application/use-cases/index.js';

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

// Manual DI for now
const folderRepository = new FolderRepository();
const fileRepository = new FileRepository();
const searchFilesUseCase = new SearchFilesUseCase(fileRepository, folderRepository);
const searchController = new SearchController(searchFilesUseCase);

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => searchController.search(req, res));

export default router;
