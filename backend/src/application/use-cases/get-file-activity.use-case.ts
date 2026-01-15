/**
 * Get File Activity Use Case
 * 
 * Get activity log/audit trail for file operations.
 */

import { prisma } from '../../infrastructure/database/index.js';
import { IFileRepository } from '../interfaces/file-repository.interface.js';

export interface FileActivityResponse {
  id: string;
  eventType: string;
  eventData: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface GetFileActivityResult {
  activities: FileActivityResponse[];
  total: number;
}

export class GetFileActivityUseCase {
  constructor(
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, fileId: string): Promise<GetFileActivityResult> {
    const file = await this.fileRepository.findById(fileId);
    if (!file || file.userId !== userId) {
      throw new Error('File not found or access denied');
    }

    const allAuditLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        eventType: {
          in: [
            'FILE_UPLOADED',
            'FILE_DOWNLOADED',
            'FILE_DELETED',
            'FILE_RESTORED',
            'FILE_UPDATED',
            'FILE_ARCHIVED',
            'FILE_SHARED',
            'FILE_UNSHARED',
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500,
    });

    const auditLogs = allAuditLogs.filter(log => {
      if (!log.eventData || typeof log.eventData !== 'object') return false;
      const eventData = log.eventData as Record<string, unknown>;
      return eventData.fileId === fileId;
    }).slice(0, 100); // Limit to 100 after filtering

    return {
      activities: auditLogs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        eventData: log.eventData as Record<string, unknown> | null,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        success: log.success,
        errorMessage: log.errorMessage ?? undefined,
        createdAt: log.createdAt.toISOString(),
      })),
      total: auditLogs.length,
    };
  }
}
