import { Response } from 'express';
import {
  CreateUserUseCase,
  GetLoginHistoryUseCase,
  UpdateUserProfileUseCase,
} from '../../../application/use-cases/index.js';
import {
  IUserRepository,
  IDeviceSessionRepository,
  IStorageService,
} from '../../../application/interfaces/index.js';
import { AuditLogService } from '../../../infrastructure/services/index.js';
import { ListUsersDTO, CreateUserDTO } from '../../../application/dtos/index.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { extractIpAddress } from '../../utils/ip-address.util.js';
import { ResponseUtil } from '../../utils/response.util.js';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getLoginHistoryUseCase: GetLoginHistoryUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase,
    private userRepository: IUserRepository,
    private deviceSessionRepository: IDeviceSessionRepository,
    private auditLogService: AuditLogService,
    private storageService: IStorageService
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

      // Generate fresh pre-signed URL for avatar
      let avatarUrl: string | undefined;
      if (user.avatarPath) {
        try {
          avatarUrl = await this.storageService.generatePresignedUrl(user.avatarPath, 604800);
        } catch {
          // URL generation failed - continue without avatar
        }
      }

      ResponseUtil.success(res, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl,
        role: user.role,
        storageQuota: user.storageQuota.toString(),
        storageUsed: user.storageUsed.toString(),
        emailVerified: user.emailVerified,
        totpEnabled: !!user.totpSecret,
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
   * PUT /api/users/me/profile
   * Update user profile with avatar upload
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const file = req.file;
      const { firstName, lastName } = req.body;

      const dto = {
        firstName,
        lastName,
        avatarBuffer: file?.buffer,
        avatarFileName: file?.originalname,
        avatarMimeType: file?.mimetype,
      };

      const result = await this.updateUserProfileUseCase.execute(req.user.id, dto);

      ResponseUtil.success(res, result, 'Profile updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      ResponseUtil.error(res, 'UPDATE_PROFILE_ERROR', message);
    }
  }

  /**
   * GET /api/users/search
   * Search users by email for sharing (Authenticated only)
   */
  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const query = req.query.query as string;
      if (!query || query.length < 2) {
        ResponseUtil.success(res, { users: [] });
        return;
      }

      const users = await this.userRepository.searchByEmail(query, 10);

      ResponseUtil.success(res, {
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarPath, // Simplified for search suggestions
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search users';
      ResponseUtil.internalError(res, message);
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
          users: result.users.map(user => ({
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
   * DELETE /api/users/:id (Admin only)
   */
  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const id = req.params.id as string;

      if (!id) {
        ResponseUtil.validationError(res, 'User ID is required');
        return;
      }

      // Prevent admins from deleting themselves
      if (req.user.id === id) {
        ResponseUtil.error(res, 'CANNOT_DELETE_SELF', 'You cannot delete your own account');
        return;
      }

      const userToDelete = await this.userRepository.findById(id);
      if (!userToDelete) {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }

      await this.userRepository.delete(id);

      // Log the action
      const ipAddress = extractIpAddress(req);
      const userAgent = Array.isArray(req.headers['user-agent'])
        ? req.headers['user-agent'][0]
        : req.headers['user-agent'] || undefined;

      await this.auditLogService.logEvent({
        userId: req.user.id,
        eventType: 'USER_DELETED',
        eventData: { deletedUserId: id, deletedUserEmail: userToDelete.email },
        ipAddress,
        userAgent,
        success: true,
      });

      ResponseUtil.success(res, undefined, 'User deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      ResponseUtil.error(res, 'DELETE_USER_ERROR', message);
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
        sessions: sessions.map(session => ({
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
          isCurrent: session.id === req.sessionId,
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
      const session = await this.deviceSessionRepository.findByIdAndUserId(
        sessionId as string,
        req.user.id
      );

      if (!session) {
        ResponseUtil.notFound(res, 'Session not found');
        return;
      }

      // Revoke session
      await this.deviceSessionRepository.revoke(sessionId as string);

      // Log session revocation
      const ipAddress = extractIpAddress(req);
      const userAgent = Array.isArray(req.headers['user-agent'])
        ? req.headers['user-agent'][0]
        : req.headers['user-agent'] || undefined;

      await this.auditLogService.logSessionRevoked(req.user.id, sessionId as string, {
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
      const user = req.user;
      if (!user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // Get all active sessions before revoking
      let sessions = await this.deviceSessionRepository.findActiveSessionsByUserId(user.id);

      // If we have a current session (which we should for an authenticated request),
      // filter it out from the "to revoke" list and keep it alive.
      if (user.sessionId) {
        sessions = sessions.filter(s => s.id !== user.sessionId);
        await this.deviceSessionRepository.revokeAllExpectCurrent(user.id, user.sessionId);
      } else {
        // Fallback for cases where sessionId isn't available (e.g. API tokens if implemented differently)
        await this.deviceSessionRepository.revokeAllForUser(user.id);
      }

      // Log session revocations
      const ipAddress = extractIpAddress(req);
      const userAgent = Array.isArray(req.headers['user-agent'])
        ? req.headers['user-agent'][0]
        : req.headers['user-agent'] || undefined;

      for (const session of sessions) {
        await this.auditLogService.logSessionRevoked(user.id, session.id, {
          ipAddress,
          userAgent,
        });
      }

      ResponseUtil.success(
        res,
        undefined,
        `All ${sessions.length} session(s) revoked successfully`
      );
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
