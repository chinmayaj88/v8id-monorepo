import { User } from '../../../domain/entities/index.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;

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

  update(
    id: string,
    data: Partial<{
      firstName?: string;
      lastName?: string;
      avatarPath?: string;
      passwordHash?: string;
      storageQuota?: bigint;
      storageUsed?: bigint;
      isActive?: boolean;
      totpSecret?: string;
      totpVerified?: boolean;
      tokenVersion?: number;
      vaultPasswordHash?: string | null;
      lastLoginAt?: Date;
      passwordResetToken?: string | null;
      passwordResetExpires?: Date | null;
    }>
  ): Promise<User>;

  findByPasswordResetToken(token: string): Promise<User | null>;

  delete(id: string): Promise<void>;

  emailExists(email: string): Promise<boolean>;

  findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ users: User[]; total: number }>;

  searchByEmail(query: string, limit?: number): Promise<User[]>;

  incrementStorageUsed(userId: string, bytes: bigint): Promise<void>;
  decrementStorageUsed(userId: string, bytes: bigint): Promise<void>;
}
