import { Prisma, File, StorageTier } from '../../../../generated/prisma/index.js';
import { prisma } from '../../database/index.js';
import { IFileRepository } from '../../../application/interfaces/files/file-repository.interface.js';

export class FileRepository implements IFileRepository {
  async create(data: {
    userId: string;
    folderId?: string | null;
    name: string;
    storageKey: string;
    storageTier: StorageTier;
    size: bigint;
    mimeType: string;
    extension?: string;
    thumbnailKey?: string;
    isOfflineAvailable?: boolean;
  }): Promise<File> {
    return prisma.file.create({
      data: {
        userId: data.userId,
        folderId: data.folderId ?? null,
        name: data.name,
        storageKey: data.storageKey,
        storageTier: data.storageTier,
        size: data.size,
        mimeType: data.mimeType,
        extension: data.extension,
        thumbnailKey: data.thumbnailKey,
        isOfflineAvailable: data.isOfflineAvailable ?? false,
      },
    });
  }

  async findById(id: string): Promise<File | null> {
    return prisma.file.findUnique({
      where: { id },
      include: {
        folder: true,
      },
    });
  }

  async findByFolderId(folderId: string | null, userId: string): Promise<File[]> {
    return prisma.file.findMany({
      where: {
        folderId: folderId ?? null,
        userId,
        isDeleted: false,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(id: string, data: Partial<File>): Promise<File> {
    // Only allow updating safe fields
    const safeData: Prisma.FileUpdateInput = {};
    if (data.name !== undefined) safeData.name = data.name;
    if (data.folderId !== undefined)
      safeData.folder = data.folderId ? { connect: { id: data.folderId } } : { disconnect: true };
    if (data.isOfflineAvailable !== undefined)
      safeData.isOfflineAvailable = data.isOfflineAvailable;
    if (data.isDeleted !== undefined) safeData.isDeleted = data.isDeleted;

    return prisma.file.update({
      where: { id },
      data: safeData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.file.delete({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.file.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async findAllByUserId(
    userId: string,
    options?: {
      search?: string;
      tier?: StorageTier;
      isDeleted?: boolean;
      folderId?: string | null;
    }
  ): Promise<File[]> {
    const where: Prisma.FileWhereInput = {
      userId,
      isDeleted: options?.isDeleted ?? false,
    };

    if (options?.search) {
      where.name = { contains: options.search }; // Case-insensitive depends on DB collation
    }

    if (options?.tier) {
      where.storageTier = options.tier;
    }

    if (options?.folderId !== undefined) {
      where.folderId = options.folderId;
    }

    return prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsByName(folderId: string | null, name: string, userId: string): Promise<boolean> {
    const count = await prisma.file.count({
      where: {
        folderId: folderId ?? null,
        userId,
        name,
        isDeleted: false,
      },
    });
    return count > 0;
  }

  async findDescendants(folderIds: string[], userId: string): Promise<File[]> {
    if (folderIds.length === 0) return [];

    return prisma.file.findMany({
      where: {
        userId,
        folderId: { in: folderIds },
        isDeleted: false,
      },
    });
  }
}
