import { prisma, Prisma, File, StorageTier } from '../../database/index.js';
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

  async restore(id: string): Promise<void> {
    await prisma.file.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  async findAllByUserId(
    userId: string,
    options?: {
      search?: string;
      tier?: StorageTier;
      isDeleted?: boolean;
      folderId?: string | null;
      limit?: number;
      offset?: number;
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
      take: options?.limit,
      skip: options?.offset,
      include: { fileShares: true },
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

  async findDescendants(
    folderIds: string[],
    userId: string,
    includeDeleted: boolean = false
  ): Promise<File[]> {
    if (folderIds.length === 0) return [];

    const where: Prisma.FileWhereInput = {
      userId,
      folderId: { in: folderIds },
    };

    if (!includeDeleted) {
      where.isDeleted = false;
    }

    return prisma.file.findMany({
      where,
    });
  }

  async findUpdatedSince(userId: string, since: Date): Promise<File[]> {
    return prisma.file.findMany({
      where: {
        userId,
        isDeleted: false,
        updatedAt: {
          gt: since,
        },
      },
      include: { fileShares: true },
    });
  }
  async getStorageUsageByMimeType(
    userId: string
  ): Promise<{ mimeType: string; totalSize: bigint }[]> {
    const result = await prisma.file.groupBy({
      by: ['mimeType'],
      where: {
        userId,
        isDeleted: false,
      },
      _sum: {
        size: true,
      },
    });

    return result.map((item: { mimeType: string; _sum: { size: bigint | null } }) => ({
      mimeType: item.mimeType,
      totalSize: item._sum.size || BigInt(0),
    }));
  }
  async findContentsByFolderId(
    folderId: string,
    options?: {
      isDeleted?: boolean;
      tier?: StorageTier;
      limit?: number;
      offset?: number;
    }
  ): Promise<File[]> {
    const where: Prisma.FileWhereInput = {
      folderId,
      isDeleted: options?.isDeleted ?? false,
    };

    if (options?.tier) {
      where.storageTier = options.tier;
    }

    return prisma.file.findMany({
      where,
      orderBy: { name: 'asc' },
      take: options?.limit,
      skip: options?.offset,
      include: { fileShares: true },
    });
  }
  async getMediaAlbums(
    userId: string,
    type: 'image' | 'video' | 'document'
  ): Promise<
    {
      folderId: string | null;
      folderName: string;
      count: number;
      thumbnailKey: string | null;
      thumbnailFileId: string | null;
    }[]
  > {
    const where: Prisma.FileWhereInput = {
      userId,
      isDeleted: false,
    };

    if (type === 'document') {
      where.OR = [
        { mimeType: { contains: 'pdf' } },
        { mimeType: { contains: 'word' } },
        { mimeType: { contains: 'text' } },
        { mimeType: { contains: 'presentation' } },
        { mimeType: { contains: 'spreadsheet' } },
      ];
    } else {
      where.mimeType = { startsWith: type + '/' };
    }

    const files = await prisma.file.findMany({
      where,
      select: {
        id: true,
        folderId: true,
        thumbnailKey: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by folderId
    const groups = new Map<string, { count: number; latest: any }>();
    const rootKey = 'ROOT';

    for (const f of files) {
      const key = f.folderId || rootKey;
      if (!groups.has(key)) {
        groups.set(key, { count: 0, latest: f });
      }
      const g = groups.get(key)!;
      g.count++;
    }

    // Fetch Folder Names
    const folderIds = Array.from(groups.keys()).filter(k => k !== rootKey);
    const foldersMap = new Map<string, string>();
    if (folderIds.length > 0) {
      const folders = await prisma.folder.findMany({
        where: { id: { in: folderIds } },
        select: { id: true, name: true },
      });
      folders.forEach(f => foldersMap.set(f.id, f.name));
    }

    // Map to result
    const result = [];
    for (const [key, val] of groups) {
      result.push({
        folderId: key === rootKey ? null : key,
        folderName: key === rootKey ? 'Root' : foldersMap.get(key) || 'Unknown',
        count: val.count,
        thumbnailKey: val.latest.thumbnailKey,
        thumbnailFileId: val.latest.id,
      });
    }
    return result;
  }
}
