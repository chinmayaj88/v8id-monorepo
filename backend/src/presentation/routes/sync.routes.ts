import { Router } from 'express';
import { SyncController } from '../controllers/sync/sync.controller.js';
import { SyncUseCase } from '../../application/use-cases/index.js';
import { FileRepository } from '../../infrastructure/repositories/files/file.repository.js';
import { FolderRepository } from '../../infrastructure/repositories/files/folder.repository.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sharedContainer } from '../../infrastructure/di/index.js';

const router: Router = Router();

// Setup Auth Middleware
const authenticate = authMiddleware(
  sharedContainer.userRepository,
  sharedContainer.deviceSessionRepository,
  sharedContainer.jwtService
);

import { ShareRepository } from '../../infrastructure/repositories/files/share.repository.js';

const fileRepository = new FileRepository();
const folderRepository = new FolderRepository();
const shareRepository = new ShareRepository();
const syncUseCase = new SyncUseCase(fileRepository, folderRepository, shareRepository);
const syncController = new SyncController(syncUseCase);

router.use(authenticate);

router.get('/', (req, res) => syncController.sync(req, res));

export default router;
