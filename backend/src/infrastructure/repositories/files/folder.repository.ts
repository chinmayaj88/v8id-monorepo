import { Folder } from '../../../../generated/prisma/index.js';
import { prisma } from '../../database/index.js';
import { IFolderRepository } from '../../../application/interfaces/files/folder-repository.interface.js';

export class FolderRepository implements IFolderRepository {
  async create(data: {
    userId: string;
    parentId?: string | null;
    name: string;
    path: string;
  }): Promise<Folder> {
    return prisma.folder.create({
      data: {
        userId: data.userId,
        parentId: data.parentId ?? null,
        name: data.name,
        path: data.path,
      },
    });
  }

  async findById(id: string): Promise<Folder | null> {
    return prisma.folder.findUnique({
      where: { id },
      include: {
        parent: true,
      },
    });
  }

  async findByParentId(parentId: string | null, userId: string): Promise<Folder[]> {
    return prisma.folder.findMany({
      where: {
        parentId: parentId ?? null,
        userId,
        isDeleted: false,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(id: string, data: Partial<Folder>): Promise<Folder> {
    return prisma.folder.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.folder.delete({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.folder.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async existsByName(parentId: string | null, name: string, userId: string): Promise<boolean> {
    const count = await prisma.folder.count({
      where: {
        parentId: parentId ?? null,
        userId,
        name,
        isDeleted: false,
      },
    });
    return count > 0;
  }

  async findDescendants(folderId: string, userId: string): Promise<Folder[]> {
    // We can use the 'path' field for efficient descendant lookup
    // Assuming path format is like /root/parent/child
    // Actually, creating a robust path-based query might be tricky without a fixed convention.
    // For now, let's look up the folder to get its path, then find all starting with that path.

    // NOTE: This implementation assumes 'path' is maintained correctly.
    // Ideally, we would fetch the folder first.

    const folder = await this.findById(folderId);
    if (!folder) return [];

    return prisma.folder.findMany({
      where: {
        userId,
        path: {
          startsWith: folder.path + '/', // Ensure it's a child path
        },
        isDeleted: false,
      },
    });
  }

  async findAllByUserId(
    userId: string,
    options?: {
      search?: string;
      parentId?: string | null;
      isDeleted?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Folder[]> {
    const where: any = {
      userId,
      isDeleted: options?.isDeleted ?? false,
    };

    if (options?.search) {
      where.name = { contains: options.search };
    }

    if (options?.parentId !== undefined) {
      where.parentId = options.parentId;
    }

    return prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
      take: options?.limit,
      skip: options?.offset,
    });
  }
}
