/**
 * User Routes
 *
 * Defines user-related API routes.
 */

import { Router, type IRouter } from 'express';
import multer from 'multer';
import { UserController } from '../controllers/user.controller.js';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case.js';
import { GetLoginHistoryUseCase } from '../../application/use-cases/get-login-history.use-case.js';
import { UpdateUserProfileUseCase } from '../../application/use-cases/update-user-profile.use-case.js';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { AuditLogRepository } from '../../infrastructure/repositories/audit-log.repository.js';
import { TotpBackupCodeRepository } from '../../infrastructure/repositories/totp-backup-code.repository.js';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository.js';
import { FileRepository } from '../../infrastructure/repositories/file.repository.js';
import { FolderRepository } from '../../infrastructure/repositories/folder.repository.js';
import { StorageAnalyticsUseCase } from '../../application/use-cases/storage-analytics.use-case.js';
import { AuditLogService } from '../../infrastructure/services/audit-log.service.js';
import { EmailServiceFactory } from '../../infrastructure/services/email.service.factory.js';
import { PasswordService } from '../../infrastructure/services/password.service.js';
import { TotpService } from '../../infrastructure/services/totp.service.js';
import { JwtService } from '../../infrastructure/services/jwt.service.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateQuery,
  validateParams,
  createUserSchema,
  listUsersSchema,
  revokeSessionSchema,
} from '../validators/index.js';

const router: IRouter = Router();

const passwordService = new PasswordService(parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

const userRepository = new UserRepository();
const totpBackupCodeRepository = new TotpBackupCodeRepository(passwordService);
const deviceSessionRepository = new DeviceSessionRepository();
const auditLogRepository = new AuditLogRepository();
const fileRepository = new FileRepository();
const folderRepository = new FolderRepository();
const totpService = new TotpService();
const jwtService = new JwtService();
const auditLogService = new AuditLogService(auditLogRepository);
const emailService = EmailServiceFactory.create();

const createUserUseCase = new CreateUserUseCase(
  userRepository,
  totpBackupCodeRepository,
  emailService,
  passwordService,
  totpService
);
const getLoginHistoryUseCase = new GetLoginHistoryUseCase(auditLogRepository);
const storageService = new TierAwareStorageService();

const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository, storageService);
const storageAnalyticsUseCase = new StorageAnalyticsUseCase(
  fileRepository,
  folderRepository,
  userRepository
);

const userController = new UserController(
  createUserUseCase,
  getLoginHistoryUseCase,
  updateUserProfileUseCase,
  storageAnalyticsUseCase,
  userRepository,
  deviceSessionRepository,
  auditLogService,
  storageService
);

router.post(
  '/',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  adminMiddleware(),
  validateBody(createUserSchema),
  (req, res) => userController.createUser(req, res)
);
router.get(
  '/',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  adminMiddleware(),
  validateQuery(listUsersSchema),
  (req, res) => userController.listUsers(req, res)
);

// User routes
router.get(
  '/me/profile',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  (req, res) => userController.getCurrentUser(req as any, res)
);

router.get(
  '/me/storage',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  (req, res) => userController.getStorageAnalytics(req as any, res)
);

// Multer config for avatar upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars'));
    }
  },
});

router.put(
  '/me/profile',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  upload.single('avatar'),
  (req, res) => userController.updateProfile(req, res)
);

// Session management routes
router.get(
  '/me/sessions',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  (req, res) => userController.listSessions(req, res)
);
router.delete(
  '/me/sessions/:sessionId',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  validateParams(revokeSessionSchema),
  (req, res) => userController.revokeSession(req, res)
);
router.post(
  '/me/sessions/revoke-all',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  (req, res) => userController.revokeAllSessions(req, res)
);

router.get(
  '/me/login-history',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  (req, res) => userController.getLoginHistory(req, res)
);

export default router;
