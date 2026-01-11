/**
 * Device Session Repository Implementation
 * 
 * Concrete implementation of IDeviceSessionRepository using Prisma.
 */

import { prisma } from '../database';
import {
  IDeviceSessionRepository,
  DeviceSession,
} from '../../application/interfaces/device-session-repository.interface';

export class DeviceSessionRepository implements IDeviceSessionRepository {
  private toDomain(prismaSession: any): DeviceSession {
    return {
      id: prismaSession.id,
      userId: prismaSession.userId,
      deviceType: prismaSession.deviceType,
      deviceName: prismaSession.deviceName,
      deviceId: prismaSession.deviceId,
      userAgent: prismaSession.userAgent ?? undefined,
      ipAddress: prismaSession.ipAddress ?? undefined,
      location: prismaSession.location ?? undefined,
      accessToken: prismaSession.accessToken,
      refreshToken: prismaSession.refreshToken,
      expiresAt: prismaSession.expiresAt,
      lastActiveAt: prismaSession.lastActiveAt,
      isActive: prismaSession.isActive,
      isRevoked: prismaSession.isRevoked,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,
    };
  }

  async create(data: {
    userId: string;
    deviceType: 'MOBILE' | 'WEB';
    deviceName: string;
    deviceId: string;
    userAgent?: string;
    ipAddress?: string;
    location?: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<DeviceSession> {
    const session = await prisma.deviceSession.create({
      data,
    });

    return this.toDomain(session);
  }

  async findByRefreshToken(refreshToken: string): Promise<DeviceSession | null> {
    const session = await prisma.deviceSession.findUnique({
      where: { refreshToken },
    });

    if (!session) {
      return null;
    }

    return this.toDomain(session);
  }

  async findByAccessToken(accessToken: string): Promise<DeviceSession | null> {
    const session = await prisma.deviceSession.findUnique({
      where: { accessToken },
    });

    if (!session) {
      return null;
    }

    return this.toDomain(session);
  }

  async findActiveSessionsByUserId(userId: string): Promise<DeviceSession[]> {
    const sessions = await prisma.deviceSession.findMany({
      where: {
        userId,
        isActive: true,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return sessions.map((session) => this.toDomain(session));
  }

  async countActiveSessionsByType(
    userId: string,
    deviceType: 'MOBILE' | 'WEB'
  ): Promise<number> {
    return prisma.deviceSession.count({
      where: {
        userId,
        deviceType,
        isActive: true,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async revoke(sessionId: string): Promise<void> {
    await prisma.deviceSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.deviceSession.updateMany({
      where: {
        userId,
        isActive: true,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  async updateLastActive(sessionId: string): Promise<void> {
    await prisma.deviceSession.update({
      where: { id: sessionId },
      data: {
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async updateTokens(sessionId: string, accessToken: string, refreshToken: string): Promise<void> {
    await prisma.deviceSession.update({
      where: { id: sessionId },
      data: {
        accessToken,
        refreshToken,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.deviceSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Find session by ID and verify it belongs to the user
   * Optimized for session revocation - single query instead of fetching all sessions
   */
  async findByIdAndUserId(sessionId: string, userId: string): Promise<DeviceSession | null> {
    const session = await prisma.deviceSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return null;
    }

    return this.toDomain(session);
  }
}

