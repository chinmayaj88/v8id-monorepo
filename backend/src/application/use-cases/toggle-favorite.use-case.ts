/**
 * Toggle Favorite Use Case
 * 
 * Add or remove a file/folder from favorites.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { prisma } from '../../infrastructure/database';

export interface ToggleFavoriteDTO {
  fileId?: string | null;
  folderId?: string | null;
}

export interface ToggleFavoriteResult {
  isFavorite: boolean;
  message: string;
}

export class ToggleFavoriteUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, dto: ToggleFavoriteDTO): Promise<ToggleFavoriteResult> {
    // 1. Validate that either fileId or folderId is provided
    if ((!dto.fileId && !dto.folderId) || (dto.fileId && dto.folderId)) {
      throw new Error('Either fileId or folderId must be provided, but not both');
    }

    // 2. Verify file/folder exists and user has access
    if (dto.fileId) {
      const file = await this.fileRepository.findById(dto.fileId);
      if (!file || file.userId !== userId) {
        throw new Error('File not found or access denied');
      }
    } else if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== userId) {
        throw new Error('Folder not found or access denied');
      }
    }

    // 3. Check if favorite exists
    const existing = await prisma.fileFavorite.findFirst({
      where: {
        userId,
        fileId: dto.fileId || null,
        folderId: dto.folderId || null,
      },
    });

    if (existing) {
      // Remove favorite
      await prisma.fileFavorite.delete({
        where: { id: existing.id },
      });
      return {
        isFavorite: false,
        message: 'Removed from favorites',
      };
    } else {
      // Add favorite
      await prisma.fileFavorite.create({
        data: {
          userId,
          fileId: dto.fileId || null,
          folderId: dto.folderId || null,
        },
      });
      return {
        isFavorite: true,
        message: 'Added to favorites',
      };
    }
  }
}
