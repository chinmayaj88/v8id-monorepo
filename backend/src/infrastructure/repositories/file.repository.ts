/**
 * File Repository Implementation
 *
 * Concrete implementation of IFileRepository using Prisma.
 */

import { prisma } from '../database/index.js';
import { IFileRepository } from '../../application/interfaces/file-repository.interface.js';
import { File, FileStatus, FileType, StorageTier } from '../../domain/entities/file.js';
import type { PrismaFile, PrismaFileWhereInput, PrismaFileOrderByInput } from './types.js';
import type { Prisma } from '../../../generated/prisma/client.js';

export class FileRepository implements IFileRepository {
  /**
   * Map Prisma file to domain File entity
   */
  private toDomain(prismaFile: PrismaFile): File {
    return new File(
      prismaFile.id,
      prismaFile.userId,
      prismaFile.folderId ?? null,
      prismaFile.name,
      prismaFile.originalName,
      prismaFile.mimeType,
      prismaFile.size,
      prismaFile.type as FileType,
      prismaFile.status as FileStatus,
      (prismaFile.storageTier as StorageTier) || StorageTier.STANDARD, // Default to STANDARD for backward compatibility
      prismaFile.ociObjectName,
      prismaFile.hash,
      prismaFile.thumbnailObjectName ?? undefined,
      prismaFile.thumbnailGenerated ?? false,
      prismaFile.description ?? undefined,
      prismaFile.tags
        ? Array.isArray(prismaFile.tags)
          ? (prismaFile.tags as string[])
          : []
        : undefined,
      prismaFile.metadata
        ? typeof prismaFile.metadata === 'object'
          ? (prismaFile.metadata as Record<string, unknown>)
          : undefined
        : undefined,
      prismaFile.expiresAt ?? undefined,
      prismaFile.createdAt,
      prismaFile.updatedAt,
      prismaFile.deletedAt ?? undefined
    );
  }

  async findById(id: string): Promise<File | null> {
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return null;
    }

    return this.toDomain(file);
  }

  async findByOciObjectName(ociObjectName: string): Promise<File | null> {
    const file = await prisma.file.findUnique({
      where: { ociObjectName },
    });

    if (!file) {
      return null;
    }

    return this.toDomain(file);
  }

  async findByHash(hash: string, userId: string): Promise<File | null> {
    const file = await prisma.file.findFirst({
      where: {
        hash,
        userId,
        status: FileStatus.ACTIVE,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!file) {
      return null;
    }

    return this.toDomain(file);
  }

  async create(fileData: {
    userId: string;
    folderId?: string | null;
    name: string;
    originalName: string;
    mimeType: string;
    size: bigint;
    type: FileType;
    status: FileStatus;
    storageTier?: StorageTier;
    ociObjectName: string;
    hash: string;
    thumbnailObjectName?: string;
    thumbnailGenerated?: boolean;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<File> {
    const file = await prisma.file.create({
      data: {
        userId: fileData.userId,
        folderId: fileData.folderId ?? null,
        name: fileData.name,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
        type: fileData.type,
        status: fileData.status,
        storageTier: fileData.storageTier || StorageTier.STANDARD, // Default to STANDARD
        ociObjectName: fileData.ociObjectName,
        hash: fileData.hash,
        thumbnailObjectName: fileData.thumbnailObjectName ?? null,
        thumbnailGenerated: fileData.thumbnailGenerated ?? false,
        description: fileData.description ?? null,
        ...(fileData.tags !== undefined && { tags: fileData.tags as Prisma.InputJsonValue }),
        ...(fileData.metadata !== undefined && {
          metadata: fileData.metadata as Prisma.InputJsonValue,
        }),
      },
    });

    return this.toDomain(file);
  }

  async update(
    id: string,
    data: Partial<{
      name?: string;
      folderId?: string | null;
      description?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      status?: FileStatus;
      deletedAt?: Date | null;
      expiresAt?: Date | null;
      thumbnailObjectName?: string | null;
      thumbnailGenerated?: boolean;
    }>
  ): Promise<File> {
    const updateData: Prisma.FileUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.folderId !== undefined) {
      updateData.folder = data.folderId ? { connect: { id: data.folderId } } : { disconnect: true };
    }
    if (data.description !== undefined) {
      updateData.description = data.description ?? null;
    }
    if (data.tags !== undefined) {
      // For JSON fields, use Prisma's InputJsonValue type
      updateData.tags = (data.tags ?? null) as Prisma.InputJsonValue;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = (data.metadata ?? null) as Prisma.InputJsonValue;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ?? null;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ?? null;
    if (data.thumbnailObjectName !== undefined) {
      updateData.thumbnailObjectName = data.thumbnailObjectName ?? null;
    }
    if (data.thumbnailGenerated !== undefined) {
      updateData.thumbnailGenerated = data.thumbnailGenerated;
    }

    const file = await prisma.file.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(file);
  }

  async delete(id: string): Promise<void> {
    await this.update(id, {
      status: FileStatus.DELETED,
      deletedAt: new Date(),
    });
  }

  async hardDelete(id: string): Promise<void> {
    await prisma.file.delete({
      where: { id },
    });
  }

  /**
   * Batch hard delete files (optimized for bulk operations)
   */
  async batchHardDelete(fileIds: string[]): Promise<number> {
    if (fileIds.length === 0) {
      return 0;
    }

    const result = await prisma.file.deleteMany({
      where: {
        id: { in: fileIds },
      },
    });

    return result.count;
  }

  async restore(id: string): Promise<File> {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
      throw new Error('File not found');
    }

    return this.update(id, {
      status: FileStatus.ACTIVE,
      deletedAt: null,
    });
  }

  async findByUserId(
    userId: string,
    options?: {
      folderId?: string | null;
      status?: FileStatus;
      type?: FileType;
      search?: string;
      page?: number;
      limit?: number;
      orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<{ files: File[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: PrismaFileWhereInput = {
      userId,
      ...(options?.folderId !== undefined && { folderId: options.folderId ?? null }),
      ...(options?.status !== undefined && { status: options.status }),
      ...(options?.type !== undefined && { type: options.type }),
      ...(options?.search && {
        OR: [
          { name: { contains: options.search } },
          { originalName: { contains: options.search } },
          { description: { contains: options.search } },
        ],
      }),
    };

    const orderBy: PrismaFileOrderByInput = {};
    if (options?.orderBy) {
      orderBy[options.orderBy] = options.orderDirection || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);

    return {
      files: files.map(f => this.toDomain(f)),
      total,
    };
  }

  async findByFolderId(
    folderId: string,
    userId: string,
    options?: {
      status?: FileStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ files: File[]; total: number }> {
    return this.findByUserId(userId, {
      folderId,
      status: options?.status,
      page: options?.page,
      limit: options?.limit,
    });
  }

  async findRootFiles(
    userId: string,
    options?: {
      status?: FileStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ files: File[]; total: number }> {
    return this.findByUserId(userId, {
      folderId: null,
      status: options?.status,
      page: options?.page,
      limit: options?.limit,
    });
  }

  async getStorageUsedByUser(userId: string): Promise<bigint> {
    // Optimized: Use aggregate query (already efficient)
    // Consider caching this result for frequently accessed users
    const result = await prisma.file.aggregate({
      where: {
        userId,
        status: FileStatus.ACTIVE,
      },
      _sum: {
        size: true,
      },
    });

    return result._sum.size || BigInt(0);
  }

  /**
   * Batch update file status (optimized for bulk operations)
   */
  async batchUpdateStatus(fileIds: string[], status: FileStatus): Promise<number> {
    const result = await prisma.file.updateMany({
      where: {
        id: { in: fileIds },
      },
      data: {
        status,
        ...(status === FileStatus.DELETED && { deletedAt: new Date() }),
      },
    });

    return result.count;
  }

  /**
   * Batch update folder ID (optimized for bulk move)
   */
  async batchUpdateFolder(
    userId: string,
    fileIds: string[],
    folderId: string | null
  ): Promise<number> {
    const result = await prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        userId, // Security: only update user's own files
      },
      data: {
        folderId: folderId ?? null,
      },
    });

    return result.count;
  }

  async findByStatus(
    status: FileStatus,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ files: File[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.file.count({ where: { status } }),
    ]);

    return {
      files: files.map(f => this.toDomain(f)),
      total,
    };
  }

  async updateStatus(id: string, status: FileStatus): Promise<File> {
    return this.update(id, { status });
  }

  async nameExistsInFolder(
    userId: string,
    folderId: string | null,
    name: string
  ): Promise<boolean> {
    const count = await prisma.file.count({
      where: {
        userId,
        folderId: folderId ?? null,
        name,
        status: FileStatus.ACTIVE,
      },
    });

    return count > 0;
  }

  /**
   * Find all files recursively in folder hierarchy - OPTIMIZED
   * Uses batch queries instead of recursive loops
   */
  async findByFolderIdRecursive(folderId: string): Promise<File[]> {
    // Collect all folder IDs in the hierarchy
    const folderIds = new Set<string>([folderId]);
    let currentLevel = [folderId];
    let hasMore = true;

    // Collect all descendant folder IDs (batch approach)
    while (hasMore) {
      const children = await prisma.folder.findMany({
        where: {
          parentId: { in: currentLevel },
        },
        select: { id: true },
      });

      if (children.length === 0) {
        hasMore = false;
      } else {
        const newIds = children.map(f => f.id);
        newIds.forEach(id => folderIds.add(id));
        currentLevel = newIds;
      }
    }

    // Get all files from all folders in one query (much more efficient!)
    const allFiles = await prisma.file.findMany({
      where: {
        folderId: { in: Array.from(folderIds) },
      },
    });

    return allFiles.map(f => this.toDomain(f));
  }

  /**
   * Find all expired files (expiresAt <= now AND status = ACTIVE)
   * Optimized for auto-delete scheduled jobs - uses database query instead of fetching all files
   */
  async findExpiredFiles(): Promise<File[]> {
    const now = new Date();
    const files = await prisma.file.findMany({
      where: {
        status: FileStatus.ACTIVE,
        expiresAt: {
          lte: now,
          not: null,
        },
      },
    });

    return files.map(f => this.toDomain(f));
  }
}
