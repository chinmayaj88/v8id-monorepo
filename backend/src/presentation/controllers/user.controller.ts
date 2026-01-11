/**
 * User Controller
 * 
 * Handles user-related HTTP requests.
 */

import { Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { GetLoginHistoryUseCase } from '../../application/use-cases/get-login-history.use-case';
import { IUserRepository } from '../../application/interfaces/user-repository.interface';
import { IDeviceSessionRepository } from '../../application/interfaces/device-session-repository.interface';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { UpdateUserDTO, ListUsersDTO } from '../../application/dtos/user.dto';
import { CreateUserDTO } from '../../application/dtos/auth.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { extractIpAddress } from '../utils/ip-address.util';
import { ResponseUtil } from '../utils/response.util';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getLoginHistoryUseCase: GetLoginHistoryUseCase,
    private userRepository: IUserRepository,
    private deviceSessionRepository: IDeviceSessionRepository,
    private auditLogService: AuditLogService
  ) {}

  /**
   * POST /api/users (Admin only)
   */
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const dto: CreateUserDTO = req.body;

      // Validate required fields
      if (!dto.email || !dto.password) {
        ResponseUtil.validationError(res, 'Email and password are required');
        return;
      }

      const result = await this.createUserUseCase.execute(dto, req.user.id);

      ResponseUtil.created(res, result, 'User created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User creation failed';
      ResponseUtil.error(res, 'CREATE_USER_ERROR', message);
    }
  }

  /**
   * GET /api/users/me
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const user = await this.userRepository.findById(req.user.id);
      if (!user) {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }

      ResponseUtil.success(res, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        storageQuota: user.storageQuota.toString(),
        storageUsed: user.storageUsed.toString(),
        emailVerified: user.emailVerified,
        totpEnabled: !!user.totpSecret, // TOTP is enabled if secret exists
        totpVerified: user.totpVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      ResponseUtil.internalError(res, message);
    }
  }

  /**
   * PATCH /api/users/me
   */
  async updateCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const dto: UpdateUserDTO = req.body;

      const user = await this.userRepository.update(req.user.id, dto);

      ResponseUtil.success(res, {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      ResponseUtil.error(res, 'UPDATE_ERROR', message);
    }
  }

  /**
   * GET /api/users (Admin only)
   */
  async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const dto: ListUsersDTO = {
        page,
        limit,
        search: req.query.search as string | undefined,
      };

      const result = await this.userRepository.findAll(dto);

      ResponseUtil.successWithPagination(
        res,
        {
          users: result.users.map((user) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            storageQuota: user.storageQuota.toString(),
            storageUsed: user.storageUsed.toString(),
            isActive: user.isActive,
            totpEnabled: !!user.totpSecret, // TOTP is enabled if secret exists
            createdAt: user.createdAt,
          })),
        },
        {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list users';
      ResponseUtil.internalError(res, message);
    }
  }

  /**
   * GET /api/users/me/sessions
   * List all active sessions for the current user
   */
  async listSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const sessions = await this.deviceSessionRepository.findActiveSessionsByUserId(req.user.id);

      ResponseUtil.success(res, {
        sessions: sessions.map((session) => ({
          id: session.id,
          deviceType: session.deviceType,
          deviceName: session.deviceName,
          deviceId: session.deviceId,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          location: session.location,
          lastActiveAt: session.lastActiveAt,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list sessions';
      ResponseUtil.internalError(res, message);
    }
  }

  /**
   * DELETE /api/users/me/sessions/:sessionId
   * Revoke a specific session
   */
  async revokeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      // Verify session belongs to user - optimized query (single query instead of fetching all sessions)
      const session = await this.deviceSessionRepository.findByIdAndUserId(sessionId, req.user.id);

      if (!session) {
        ResponseUtil.notFound(res, 'Session not found');
        return;
      }

      // Revoke session
      await this.deviceSessionRepository.revoke(sessionId);

      // Log session revocation
      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;
      await this.auditLogService.logSessionRevoked(req.user.id, sessionId, {
        ipAddress,
        userAgent,
      });

      ResponseUtil.success(res, undefined, 'Session revoked successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke session';
      ResponseUtil.error(res, 'REVOKE_SESSION_ERROR', message);
    }
  }

  /**
   * POST /api/users/me/sessions/revoke-all
   * Revoke all sessions for the current user
   */
  async revokeAllSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // Get all active sessions before revoking
      const sessions = await this.deviceSessionRepository.findActiveSessionsByUserId(req.user.id);

      // Revoke all sessions
      await this.deviceSessionRepository.revokeAllForUser(req.user.id);

      // Log session revocations
      const ipAddress = extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || undefined;
      for (const session of sessions) {
        await this.auditLogService.logSessionRevoked(req.user.id, session.id, {
          ipAddress,
          userAgent,
        });
      }

      ResponseUtil.success(res, undefined, `All ${sessions.length} session(s) revoked successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke sessions';
      ResponseUtil.error(res, 'REVOKE_SESSIONS_ERROR', message);
    }
  }

  /**
   * GET /api/users/me/login-history
   * Get user's login history
   */
  async getLoginHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const eventType = req.query.eventType as string | undefined;

      const result = await this.getLoginHistoryUseCase.execute(req.user.id, {
        page,
        limit,
        eventType,
      });

      ResponseUtil.success(res, result, 'Login history retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get login history';
      ResponseUtil.error(res, 'GET_LOGIN_HISTORY_ERROR', message);
    }
  }
}

