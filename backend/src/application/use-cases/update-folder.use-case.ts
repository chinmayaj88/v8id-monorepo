/**
 * Update Folder Use Case
 * 
 * Handles folder metadata updates with validation.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { UpdateFolderDTO, FolderResponseDTO } from '../dtos/file.dto.js';
import { Folder } from '../../domain/entities/folder.js';

export class UpdateFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, folderId: string, dto: UpdateFolderDTO): Promise<FolderResponseDTO> {
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!folder.isActive()) {
      throw new Error('Cannot update deleted folder');
    }

    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new Error('Folder name cannot be empty');
      }

      if (dto.name.length > 255) {
        throw new Error('Folder name must be less than 255 characters');
      }
    }

    if (dto.parentId !== undefined && dto.parentId !== folder.parentId) {
      if (dto.parentId !== null) {
        const wouldCreateCircular = await this.folderRepository.wouldCreateCircularReference(folderId, dto.parentId);
        if (wouldCreateCircular) {
          throw new Error('Cannot move folder into itself or its subfolders');
        }

        const newParent = await this.folderRepository.findById(dto.parentId);
        if (!newParent || newParent.userId !== userId || !newParent.isActive()) {
          throw new Error('Parent folder not found or access denied');
        }
      }
    }

    if (dto.name && dto.name !== folder.name) {
      const targetParentId = dto.parentId !== undefined ? dto.parentId : folder.parentId;
      const nameExists = await this.folderRepository.nameExistsInParent(userId, targetParentId, dto.name);
      if (nameExists) {
        throw new Error('Folder with this name already exists in the target parent');
      }
    }

    const updatedFolder = await this.folderRepository.update(folderId, {
      name: dto.name?.trim(),
      parentId: dto.parentId,
      description: dto.description,
      color: dto.color,
    });

    return this.folderToDto(updatedFolder);
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
