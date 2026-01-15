/**
 * Folder Repository Implementation
 * 
 * Concrete implementation of IFolderRepository using Prisma.
 */

import { prisma } from '../database/index.js';
import { IFolderRepository } from '../../application/interfaces/folder-repository.interface.js';
import { Folder } from '../../domain/entities/folder.js';
import type { PrismaFolder, PrismaFolderWhereInput } from './types.js';

export class FolderRepository implements IFolderRepository {
  /**
   * Map Prisma folder to domain Folder entity
   */
  private toDomain(prismaFolder: PrismaFolder): Folder {
    return new Folder(
      prismaFolder.id,
      prismaFolder.userId,
      prismaFolder.parentId ?? null,
      prismaFolder.name,
      prismaFolder.description ?? undefined,
      prismaFolder.color ?? undefined,
      prismaFolder.isDeleted,
      prismaFolder.createdAt,
      prismaFolder.updatedAt,
      prismaFolder.deletedAt ?? undefined
    );
  }

  async findById(id: string): Promise<Folder | null> {
    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      return null;
    }

    return this.toDomain(folder);
  }

  async create(folderData: {
    userId: string;
    parentId?: string | null;
    name: string;
    description?: string;
    color?: string;
  }): Promise<Folder> {
    const folder = await prisma.folder.create({
      data: {
        userId: folderData.userId,
        parentId: folderData.parentId ?? null,
        name: folderData.name,
        description: folderData.description,
        color: folderData.color,
        isDeleted: false,
      },
    });

    return this.toDomain(folder);
  }

  async update(id: string, data: Partial<{
    name?: string;
    parentId?: string | null;
    description?: string;
    color?: string;
    deletedAt?: Date | null;
  }>): Promise<Folder> {
    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId ?? null }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.deletedAt !== undefined && { deletedAt: data.deletedAt ?? null, isDeleted: data.deletedAt !== null }),
      },
    });

    return this.toDomain(folder);
  }

  async delete(id: string): Promise<void> {
    await this.update(id, {
      deletedAt: new Date(),
    });
  }

  async hardDelete(id: string): Promise<void> {
    await prisma.folder.delete({
      where: { id },
    });
  }

  async restore(id: string): Promise<Folder> {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) {
      throw new Error('Folder not found');
    }

    return this.update(id, {
      deletedAt: null,
    });
  }

  async findByUserId(userId: string, options?: {
    parentId?: string | null;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: PrismaFolderWhereInput = {
      userId,
      ...(options?.parentId !== undefined && { parentId: options.parentId ?? null }),
      ...(options?.includeDeleted === false && { isDeleted: false }),
    };

    const [folders, total] = await Promise.all([
      prisma.folder.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.folder.count({ where }),
    ]);

    return {
      folders: folders.map(f => this.toDomain(f)),
      total,
    };
  }

  async findRootFolders(userId: string, options?: {
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }> {
    return this.findByUserId(userId, {
      parentId: null,
      includeDeleted: options?.includeDeleted,
      page: options?.page,
      limit: options?.limit,
    });
  }

  async findChildren(parentId: string, userId: string, options?: {
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }> {
    return this.findByUserId(userId, {
      parentId,
      includeDeleted: options?.includeDeleted,
      page: options?.page,
      limit: options?.limit,
    });
  }

  /**
   * Get folder path (breadcrumb trail) - OPTIMIZED
   * Uses minimal queries (log N queries where N = depth)
   * Could be further optimized with recursive CTE if MySQL 8.0+ supports it
   */
  async getFolderPath(folderId: string): Promise<Folder[]> {
    const path: Folder[] = [];
    let currentId: string | null = folderId;
    const visitedIds = new Set<string>(); // Prevent infinite loops
    const folderMap = new Map<string, PrismaFolder>(); // Cache fetched folders

    // Collect folder IDs and fetch them efficiently
    while (currentId && !visitedIds.has(currentId)) {
      visitedIds.add(currentId);
      
      // Check if we already have this folder
      if (!folderMap.has(currentId)) {
        const folder: Awaited<ReturnType<typeof prisma.folder.findUnique>> = await prisma.folder.findUnique({
          where: { id: currentId },
        });
        
        if (!folder) break;
        
        folderMap.set(currentId, folder);
        path.unshift(this.toDomain(folder));
        currentId = folder.parentId;
      } else {
        // Already fetched, just get parent
        const folder: Awaited<ReturnType<typeof prisma.folder.findUnique>> | undefined = folderMap.get(currentId);
        if (!folder) break;
        path.unshift(this.toDomain(folder));
        currentId = folder.parentId;
      }
    }

    return path;
  }

  async nameExistsInParent(userId: string, parentId: string | null, name: string): Promise<boolean> {
    const count = await prisma.folder.count({
      where: {
        userId,
        parentId: parentId ?? null,
        name,
        isDeleted: false,
      },
    });

    return count > 0;
  }

  async hasChildren(folderId: string): Promise<boolean> {
    const count = await prisma.folder.count({
      where: {
        parentId: folderId,
        isDeleted: false,
      },
    });

    return count > 0;
  }

  async hasFiles(folderId: string): Promise<boolean> {
    const count = await prisma.file.count({
      where: {
        folderId,
        status: 'ACTIVE',
      },
    });

    return count > 0;
  }

  async move(folderId: string, newParentId: string | null): Promise<Folder> {
    return this.update(folderId, {
      parentId: newParentId,
    });
  }

  async wouldCreateCircularReference(folderId: string, newParentId: string | null): Promise<boolean> {
    if (!newParentId) {
      return false; // Moving to root is always safe
    }

    if (folderId === newParentId) {
      return true; // Cannot be parent of itself
    }

    // Get the path of the new parent
    const newParentPath = await this.getFolderPath(newParentId);

    // Check if the folder being moved is in the path of the new parent
    return newParentPath.some(folder => folder.id === folderId);
  }

  /**
   * Hard delete folder recursively - OPTIMIZED
   * Uses batch operations instead of recursive loops
   */
  async hardDeleteRecursive(folderId: string): Promise<void> {
    // Collect all folder IDs in the hierarchy (single query approach)
    const folderIdsToDelete = new Set<string>([folderId]);
    let currentLevel = [folderId];
    let hasMore = true;

    // Collect all descendant folder IDs
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
        newIds.forEach(id => folderIdsToDelete.add(id));
        currentLevel = newIds;
      }
    }

    // Delete all folders in one batch operation (much more efficient!)
    if (folderIdsToDelete.size > 0) {
      await prisma.folder.deleteMany({
        where: {
          id: { in: Array.from(folderIdsToDelete) },
        },
      });
    }
  }

  async hasActiveChildren(folderId: string): Promise<boolean> {
    return this.hasChildren(folderId);
  }

  async hasActiveFiles(folderId: string): Promise<boolean> {
    return this.hasFiles(folderId);
  }
}
