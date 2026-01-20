/**
 * List Folders Use Case
 *
 * Handles folder listing with filtering and pagination.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { ListFoldersDTO, FolderResponseDTO } from '../dtos/file.dto.js';
import { Folder } from '../../domain/entities/folder.js';

export interface ListFoldersResult {
  folders: FolderResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListFoldersUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute(userId: string, dto: ListFoldersDTO): Promise<ListFoldersResult> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const includeDeleted = dto.includeDeleted || false;
    const search = dto.search;

    // If search is provided, perform global search (ignore parentId constraints)
    if (search) {
      const result = await this.folderRepository.findByUserId(userId, {
        search,
        includeDeleted,
        page,
        limit,
      });
      return this.formatResult(result.folders, result.total, page, limit);
    }

    // If parentId is explicitly null, get root folders
    if (dto.parentId === null) {
      const result = await this.folderRepository.findRootFolders(userId, {
        includeDeleted,
        page,
        limit,
      });
      return this.formatResult(result.folders, result.total, page, limit);
    }

    // Otherwise, get folders by parent or all folders
    const options = {
      parentId: dto.parentId,
      includeDeleted,
      page,
      limit,
    };

    const result = await this.folderRepository.findByUserId(userId, options);
    return this.formatResult(result.folders, result.total, page, limit);
  }

  private formatResult(
    folders: Folder[],
    total: number,
    page: number,
    limit: number
  ): ListFoldersResult {
    return {
      folders: folders.map(this.folderToDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private folderToDto(folder: Folder): FolderResponseDTO {
    return {
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
    };
  }
}
