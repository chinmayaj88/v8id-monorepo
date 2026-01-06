/**
 * User Repository Implementation
 * 
 * Concrete implementation of IUserRepository using Prisma.
 */

import { prisma } from '../database';
import { IUserRepository } from '../../application/interfaces/user-repository.interface';
import { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/entities/user-role';

export class UserRepository implements IUserRepository {
  /**
   * Map Prisma user to domain User entity
   */
  private toDomain(prismaUser: any): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.passwordHash,
      prismaUser.role as UserRole,
      prismaUser.firstName ?? undefined,
      prismaUser.lastName ?? undefined,
      prismaUser.avatarUrl ?? undefined,
      prismaUser.emailVerified,
      prismaUser.storageQuota,
      prismaUser.storageUsed,
      prismaUser.isActive,
      prismaUser.totpSecret ?? undefined,
      prismaUser.totpVerified,
      prismaUser.lastLoginAt ?? undefined,
      prismaUser.createdAt,
      prismaUser.updatedAt
    );
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async create(userData: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    role?: 'USER' | 'ADMIN';
    storageQuota?: bigint;
    totpSecret?: string;
    totpVerified?: boolean;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase().trim(),
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role ?? 'USER',
        storageQuota: userData.storageQuota ?? BigInt(10737418240), // 10GB
        emailVerified: true, // Admin creates verified users
        totpSecret: userData.totpSecret,
        totpVerified: userData.totpVerified ?? false,
      },
    });

    return this.toDomain(user);
  }

  async update(
    id: string,
    data: Partial<{
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      passwordHash?: string;
      storageQuota?: bigint;
      isActive?: boolean;
      totpSecret?: string;
      totpVerified?: boolean;
      lastLoginAt?: Date;
    }>
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(user);
  }

  async delete(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    return count > 0;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ users: User[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const skip = (page - 1) * limit;
    const search = options?.search?.toLowerCase().trim();

    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => this.toDomain(user)),
      total,
    };
  }
}

