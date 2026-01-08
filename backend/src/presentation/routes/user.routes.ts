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
import { AuditLogRepository } from '../../infrastructure/repositories/audit-log.repository';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { EmailServiceFactory } from '../../infrastructure/services/email.service.factory';
import { PasswordService } from '../../infrastructure/services/password.service';
import { TotpService } from '../../infrastructure/services/totp.service';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router: IRouter = Router();

// Initialize repositories
const userRepository = new UserRepository();
const totpBackupCodeRepository = new TotpBackupCodeRepository();
const deviceSessionRepository = new DeviceSessionRepository();
const auditLogRepository = new AuditLogRepository();

// Initialize services
const passwordService = new PasswordService(parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
const totpService = new TotpService();
const jwtService = new JwtService();
const auditLogService = new AuditLogService(auditLogRepository);
const emailService = EmailServiceFactory.create();

// Initialize use cases
const createUserUseCase = new CreateUserUseCase(
  userRepository,
  totpBackupCodeRepository,
  emailService,
  passwordService,
  totpService
);

// Initialize controller
const userController = new UserController(
  createUserUseCase,
  userRepository,
  deviceSessionRepository,
  auditLogService
);

// Routes
// Admin-only routes
router.post('/', authMiddleware(userRepository, deviceSessionRepository, jwtService), adminMiddleware(), (req, res) => 
  userController.createUser(req, res)
);
router.get('/', authMiddleware(userRepository, deviceSessionRepository, jwtService), adminMiddleware(), (req, res) => 
  userController.listUsers(req, res)
);

// User routes
router.get('/me', authMiddleware(userRepository, deviceSessionRepository, jwtService), (req, res) => 
  userController.getCurrentUser(req, res)
);
router.patch('/me', authMiddleware(userRepository, deviceSessionRepository, jwtService), (req, res) => 
  userController.updateCurrentUser(req, res)
);

// Session management routes
router.get('/me/sessions', authMiddleware(userRepository, deviceSessionRepository, jwtService), (req, res) => 
  userController.listSessions(req, res)
);
router.delete('/me/sessions/:sessionId', authMiddleware(userRepository, deviceSessionRepository, jwtService), (req, res) => 
  userController.revokeSession(req, res)
);
router.post('/me/sessions/revoke-all', authMiddleware(userRepository, deviceSessionRepository, jwtService), (req, res) => 
  userController.revokeAllSessions(req, res)
);

export default router;

