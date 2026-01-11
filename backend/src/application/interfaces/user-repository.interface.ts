/**
 * User Repository Interface
 * 
 * Defines the contract for user data access operations.
 */

import { User } from '../../domain/entities/user';

export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Create a new user
   */
  create(userData: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    role?: 'USER' | 'ADMIN';
    storageQuota?: bigint;
    totpSecret?: string;
    totpVerified?: boolean;
  }): Promise<User>;

  /**
   * Update user
   */
  update(id: string, data: Partial<{
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    passwordHash?: string;
    storageQuota?: bigint;
    storageUsed?: bigint;
    isActive?: boolean;
    totpSecret?: string;
    totpVerified?: boolean;
    tokenVersion?: number;
    lastLoginAt?: Date;
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
  }>): Promise<User>;

  /**
   * Find user by password reset token
   */
  findByPasswordResetToken(token: string): Promise<User | null>;

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * List all users (for admin)
   */
  findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ users: User[]; total: number }>;
}

