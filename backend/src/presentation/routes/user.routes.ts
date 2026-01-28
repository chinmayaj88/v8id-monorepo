import { Router, type IRouter } from 'express';
import multer from 'multer';
import { userContainer, sharedContainer } from '../../infrastructure/di/index.js';
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

const userController = userContainer.userController;
const userRepository = sharedContainer.userRepository;
const deviceSessionRepository = sharedContainer.deviceSessionRepository;
const jwtService = sharedContainer.jwtService;

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

router.get(
  '/search',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  (req, res) => userController.searchUsers(req as any, res)
);

// User routes
router.get(
  '/me/profile',
  authMiddleware(userRepository, deviceSessionRepository, jwtService),
  (req, res) => userController.getCurrentUser(req as any, res)
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
