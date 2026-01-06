/**
 * User Routes
 * 
 * Defines user-related API routes.
 */

import { Router, type IRouter } from 'express';
import { UserController } from '../controllers/user.controller';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { TotpBackupCodeRepository } from '../../infrastructure/repositories/totp-backup-code.repository';
import { DeviceSessionRepository } from '../../infrastructure/repositories/device-session.repository';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router: IRouter = Router();

// Initialize repositories
const userRepository = new UserRepository();
const totpBackupCodeRepository = new TotpBackupCodeRepository();
const deviceSessionRepository = new DeviceSessionRepository();

// Initialize use cases
const createUserUseCase = new CreateUserUseCase(userRepository, totpBackupCodeRepository);

// Initialize controller
const userController = new UserController(createUserUseCase, userRepository);

// Routes
// Admin-only routes
router.post('/', authMiddleware(userRepository, deviceSessionRepository), adminMiddleware(), (req, res) => 
  userController.createUser(req, res)
);
router.get('/', authMiddleware(userRepository, deviceSessionRepository), adminMiddleware(), (req, res) => 
  userController.listUsers(req, res)
);

// User routes
router.get('/me', authMiddleware(userRepository, deviceSessionRepository), (req, res) => 
  userController.getCurrentUser(req, res)
);
router.patch('/me', authMiddleware(userRepository, deviceSessionRepository), (req, res) => 
  userController.updateCurrentUser(req, res)
);

export default router;

