/**
 * Update Folder Use Case
 * 
 * Handles folder metadata updates with validation.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { UpdateFolderDTO, FolderResponseDTO } from '../dtos/file.dto';
import { Folder } from '../../domain/entities/folder';

export class UpdateFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, folderId: string, dto: UpdateFolderDTO): Promise<FolderResponseDTO> {
    // 1. Find folder
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // 2. Verify ownership
    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify folder is active
    if (!folder.isActive()) {
      throw new Error('Cannot update deleted folder');
    }

    // 4. Validate name if being changed
    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new Error('Folder name cannot be empty');
      }

      if (dto.name.length > 255) {
        throw new Error('Folder name must be less than 255 characters');
      }
    }

    // 5. Validate parent if being changed
    if (dto.parentId !== undefined && dto.parentId !== folder.parentId) {
      // Check for circular reference
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

    // 6. Check if new name already exists in target parent
    if (dto.name && dto.name !== folder.name) {
      const targetParentId = dto.parentId !== undefined ? dto.parentId : folder.parentId;
      const nameExists = await this.folderRepository.nameExistsInParent(userId, targetParentId, dto.name);
      if (nameExists) {
        throw new Error('Folder with this name already exists in the target parent');
      }
    }

    // 7. Update folder
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
