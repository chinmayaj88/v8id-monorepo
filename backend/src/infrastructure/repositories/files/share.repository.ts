import { FileShare, FolderShare, ShareType } from '../../../../generated/prisma/index.js';
import { prisma } from '../../database/index.js';
import {
  IShareRepository,
  CreateFileShareDTO,
  CreateFolderShareDTO,
} from '../../../application/interfaces/repositories/share.repository.interface.js';

export class ShareRepository implements IShareRepository {
  async createFileShare(data: CreateFileShareDTO): Promise<FileShare> {
    return prisma.fileShare.create({
      data: {
        fileId: data.fileId,
        ownerId: data.ownerId,
        type: data.type,
        permission: data.permission,
        sharedWith: data.sharedWith,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      include: {
        file: true, // Optimistically include file info
      },
    });
  }

  async findFileShareByToken(token: string): Promise<FileShare | null> {
    return prisma.fileShare.findUnique({
      where: { token },
      include: {
        file: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarPath: true,
          },
        },
      },
    });
  }

  async findFileSharesByFileId(fileId: string): Promise<FileShare[]> {
    return prisma.fileShare.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFileSharesByEmail(email: string): Promise<FileShare[]> {
    return prisma.fileShare.findMany({
      where: {
        sharedWith: email,
        type: ShareType.INTERNAL,
      },
      include: {
        file: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatarPath: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFileShare(id: string): Promise<void> {
    await prisma.fileShare.delete({
      where: { id },
    });
  }

  // Folder Share Implementation

  async createFolderShare(data: CreateFolderShareDTO): Promise<FolderShare> {
    return prisma.folderShare.create({
      data: {
        folderId: data.folderId,
        ownerId: data.ownerId,
        type: data.type,
        permission: data.permission,
        sharedWith: data.sharedWith,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      include: {
        folder: true,
      },
    });
  }

  async findFolderShareByToken(token: string): Promise<FolderShare | null> {
    return prisma.folderShare.findUnique({
      where: { token },
      include: {
        folder: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarPath: true,
          },
        },
      },
    });
  }

  async findFolderShareByFolderId(folderId: string): Promise<FolderShare[]> {
    return prisma.folderShare.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFolderSharesByEmail(email: string): Promise<FolderShare[]> {
    return prisma.folderShare.findMany({
      where: {
        sharedWith: email,
        type: ShareType.INTERNAL,
      },
      include: {
        folder: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatarPath: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFolderShare(id: string): Promise<void> {
    await prisma.folderShare.delete({
      where: { id },
    });
  }

  async checkFolderAccess(folderId: string, email: string): Promise<FolderShare | null> {
    const share = await prisma.folderShare.findFirst({
      where: {
        folderId,
        sharedWith: email,
        type: ShareType.INTERNAL,
      },
    });
    return share;
  }
}
