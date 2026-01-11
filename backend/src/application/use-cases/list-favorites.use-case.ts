/**
 * List Favorites Use Case
 * 
 * List all favorite files and folders for a user.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { FileResponseDTO, FolderResponseDTO } from '../dtos/file.dto';
import { prisma } from '../../infrastructure/database';

export interface ListFavoritesResult {
  files: FileResponseDTO[];
  folders: FolderResponseDTO[];
  total: number;
}

export class ListFavoritesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string): Promise<ListFavoritesResult> {
    // 1. Get all favorites
    const favorites = await prisma.fileFavorite.findMany({
      where: { userId },
    });

    // 2. Separate file and folder favorites
    const fileFavorites = favorites.filter(f => f.fileId);
    const folderFavorites = favorites.filter(f => f.folderId);

    // 3. Fetch files
    const files: FileResponseDTO[] = [];
    for (const favorite of fileFavorites) {
      if (favorite.fileId) {
        const file = await this.fileRepository.findById(favorite.fileId);
        if (file && file.isActive()) {
          files.push({
            id: file.id,
            userId: file.userId,
            folderId: file.folderId,
            name: file.name,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: Number(file.size),
            type: file.type,
            status: file.status,
            description: file.description,
            tags: file.tags,
            metadata: file.metadata,
            createdAt: file.createdAt.toISOString(),
            updatedAt: file.updatedAt.toISOString(),
            deletedAt: file.deletedAt?.toISOString(),
          });
        }
      }
    }

    // 4. Fetch folders
    const folders: FolderResponseDTO[] = [];
    for (const favorite of folderFavorites) {
      if (favorite.folderId) {
        const folder = await this.folderRepository.findById(favorite.folderId);
        if (folder && !folder.isDeleted) {
          folders.push({
            id: folder.id,
            userId: folder.userId,
            parentId: folder.parentId,
            name: folder.name,
            description: folder.description,
            color: folder.color,
            isDeleted: folder.isDeleted,
            createdAt: folder.createdAt.toISOString(),
            updatedAt: folder.updatedAt.toISOString(),
            deletedAt: folder.deletedAt?.toISOString(),
          });
        }
      }
    }

    return {
      files,
      folders,
      total: files.length + folders.length,
    };
  }
}
