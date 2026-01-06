/**
 * User Controller
 * 
 * Handles user-related HTTP requests.
 */

import { Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { IUserRepository } from '../../application/interfaces/user-repository.interface';
import { UpdateUserDTO, ListUsersDTO } from '../../application/dtos/user.dto';
import { CreateUserDTO } from '../../application/dtos/auth.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private userRepository: IUserRepository
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
}

