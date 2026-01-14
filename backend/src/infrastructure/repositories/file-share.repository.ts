/**
 * File Share Repository Implementation
 * 
 * Concrete implementation of IFileShareRepository using Prisma.
 */

import { prisma } from '../database';
import { IFileShareRepository } from '../../application/interfaces/file-share-repository.interface';
import { FileShare, SharePermission } from '../../domain/entities/file-share';
import type { PrismaFileShare, PrismaFileShareUpdateInput } from './types';

export class FileShareRepository implements IFileShareRepository {
  private toDomain(prismaShare: PrismaFileShare): FileShare {
    return new FileShare(
      prismaShare.id,
      prismaShare.fileId ?? null,
      prismaShare.folderId ?? null,
      prismaShare.ownerId,
      prismaShare.sharedWithId,
      prismaShare.permission as SharePermission,
      prismaShare.createdAt,
      prismaShare.updatedAt
    );
  }

  async findById(id: string): Promise<FileShare | null> {
    const share = await prisma.fileShare.findUnique({
      where: { id },
    });

    if (!share) {
      return null;
    }

    return this.toDomain(share);
  }

  async create(shareData: {
    fileId?: string | null;
    folderId?: string | null;
    ownerId: string;
    sharedWithId: string;
    permission: SharePermission;
  }): Promise<FileShare> {
    const share = await prisma.fileShare.create({
      data: {
        fileId: shareData.fileId ?? null,
        folderId: shareData.folderId ?? null,
        ownerId: shareData.ownerId,
        sharedWithId: shareData.sharedWithId,
        permission: shareData.permission,
      },
    });

    return this.toDomain(share);
  }

  async update(id: string, data: Partial<{
    permission: SharePermission;
  }>): Promise<FileShare> {
    const updateData: PrismaFileShareUpdateInput = {};
    if (data.permission !== undefined) updateData.permission = data.permission;

    const share = await prisma.fileShare.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(share);
  }

  async delete(id: string): Promise<void> {
    await prisma.fileShare.delete({
      where: { id },
    });
  }

  async findByFileId(fileId: string): Promise<FileShare[]> {
    const shares = await prisma.fileShare.findMany({
      where: { fileId },
    });

    return shares.map(s => this.toDomain(s));
  }

  async findByFolderId(folderId: string): Promise<FileShare[]> {
    const shares = await prisma.fileShare.findMany({
      where: { folderId },
    });

    return shares.map(s => this.toDomain(s));
  }

  async findBySharedWith(userId: string): Promise<FileShare[]> {
    const shares = await prisma.fileShare.findMany({
      where: { sharedWithId: userId },
    });

    return shares.map(s => this.toDomain(s));
  }

  async findByOwner(ownerId: string): Promise<FileShare[]> {
    const shares = await prisma.fileShare.findMany({
      where: { ownerId },
    });

    return shares.map(s => this.toDomain(s));
  }

  async findShare(fileId: string | null, folderId: string | null, sharedWithId: string): Promise<FileShare | null> {
    const share = await prisma.fileShare.findFirst({
      where: {
        fileId: fileId ?? null,
        folderId: folderId ?? null,
        sharedWithId,
      },
    });

    if (!share) {
      return null;
    }

    return this.toDomain(share);
  }

  async hasAccess(userId: string, fileId: string | null, folderId: string | null): Promise<boolean> {
    const share = await this.findShare(fileId, folderId, userId);
    return share !== null;
  }

  async getPermission(userId: string, fileId: string | null, folderId: string | null): Promise<SharePermission | null> {
    const share = await this.findShare(fileId, folderId, userId);
    return share ? share.permission : null;
  }
}
