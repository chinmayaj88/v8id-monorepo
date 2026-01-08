/**
 * User Controller
 * 
 * Handles user-related HTTP requests.
 */

import { Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { IUserRepository } from '../../application/interfaces/user-repository.interface';
import { IDeviceSessionRepository } from '../../application/interfaces/device-session-repository.interface';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { UpdateUserDTO, ListUsersDTO } from '../../application/dtos/user.dto';
import { CreateUserDTO } from '../../application/dtos/auth.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { extractIpAddress } from '../utils/ip-address.util';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
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
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const dto: CreateUserDTO = req.body;

      // Validate required fields
      if (!dto.email || !dto.password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
          },
        });
        return;
      }

      const result = await this.createUserUseCase.execute(dto, req.user.id);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User creation failed';
      res.status(400).json({
        success: false,
        error: {
          code: 'CREATE_USER_ERROR',
          message,
        },
      });
    }
  }

  /**
   * GET /api/users/me
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const user = await this.userRepository.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
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
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  /**
   * PATCH /api/users/me
   */
  async updateCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const dto: UpdateUserDTO = req.body;

      const user = await this.userRepository.update(req.user.id, dto);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message,
        },
      });
    }
  }

  /**
   * GET /api/users (Admin only)
   */
  async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const dto: ListUsersDTO = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        search: req.query.search as string | undefined,
      };

      const result = await this.userRepository.findAll(dto);

      res.status(200).json({
        success: true,
        data: {
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
          pagination: {
            page: dto.page,
            limit: dto.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / (dto.limit || 50)),
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list users';
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  /**
   * GET /api/users/me/sessions
   * List all active sessions for the current user
   */
  async listSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const sessions = await this.deviceSessionRepository.findActiveSessionsByUserId(req.user.id);

      res.status(200).json({
        success: true,
        data: {
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
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list sessions';
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  /**
   * DELETE /api/users/me/sessions/:sessionId
   * Revoke a specific session
   */
  async revokeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Session ID is required',
          },
        });
        return;
      }

      // Verify session belongs to user
      const sessions = await this.deviceSessionRepository.findActiveSessionsByUserId(req.user.id);
      const session = sessions.find((s) => s.id === sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Session not found',
          },
        });
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

      res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke session';
      res.status(400).json({
        success: false,
        error: {
          code: 'REVOKE_SESSION_ERROR',
          message,
        },
      });
    }
  }

  /**
   * POST /api/users/me/sessions/revoke-all
   * Revoke all sessions for the current user
   */
  async revokeAllSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
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

      res.status(200).json({
        success: true,
        message: `All ${sessions.length} session(s) revoked successfully`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke sessions';
      res.status(400).json({
        success: false,
        error: {
          code: 'REVOKE_SESSIONS_ERROR',
          message,
        },
      });
    }
  }
}

