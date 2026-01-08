/**
 * Audit Log Repository Implementation
 * 
 * Concrete implementation of IAuditLogRepository using Prisma.
 */

import { prisma } from '../database';
import {
  IAuditLogRepository,
  AuditLog,
} from '../../application/interfaces/audit-log-repository.interface';

export class AuditLogRepository implements IAuditLogRepository {
  private toDomain(prismaLog: any): AuditLog {
    return {
      id: prismaLog.id,
      userId: prismaLog.userId ?? undefined,
      eventType: prismaLog.eventType,
      eventData: prismaLog.eventData ? (prismaLog.eventData as Record<string, any>) : undefined,
      ipAddress: prismaLog.ipAddress ?? undefined,
      userAgent: prismaLog.userAgent ?? undefined,
      success: prismaLog.success,
      errorMessage: prismaLog.errorMessage ?? undefined,
      createdAt: prismaLog.createdAt,
    };
  }

  async create(data: {
    userId?: string;
    eventType: string;
    eventData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<AuditLog> {
    const log = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        eventData: data.eventData ? JSON.parse(JSON.stringify(data.eventData)) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      },
    });

    return this.toDomain(log);
  }

  async findByUserId(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      eventType?: string;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.eventType) {
      where.eventType = options.eventType;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => this.toDomain(log)),
      total,
    };
  }

  async findByEventType(
    eventType: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where = { eventType };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => this.toDomain(log)),
      total,
    };
  }

  async findFailedLoginAttempts(userId: string, since?: Date): Promise<AuditLog[]> {
    const where: any = {
      userId,
      eventType: 'LOGIN_FAILED',
      success: false,
    };

    if (since) {
      where.createdAt = { gte: since };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 failed attempts
    });

    return logs.map((log) => this.toDomain(log));
  }
}
