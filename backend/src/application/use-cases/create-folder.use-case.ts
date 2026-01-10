/**
 * Create Folder Use Case
 * 
 * Handles folder creation with validation and hierarchy checks.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { CreateFolderDTO, FolderResponseDTO } from '../dtos/file.dto';
import { Folder } from '../../domain/entities/folder';

export class CreateFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, dto: CreateFolderDTO): Promise<FolderResponseDTO> {
    // 1. Validate folder name
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Folder name is required');
    }

    if (dto.name.length > 255) {
      throw new Error('Folder name must be less than 255 characters');
    }

    // 2. Validate parent folder if provided
    if (dto.parentId) {
      const parent = await this.folderRepository.findById(dto.parentId);
      if (!parent || parent.userId !== userId || !parent.isActive()) {
        throw new Error('Parent folder not found or access denied');
      }
    }

    // 3. Check if folder name already exists in parent
    const nameExists = await this.folderRepository.nameExistsInParent(userId, dto.parentId || null, dto.name);
    if (nameExists) {
      throw new Error('Folder with this name already exists in the parent folder');
    }

    // 4. Create folder
    const folder = await this.folderRepository.create({
      userId,
      parentId: dto.parentId || null,
      name: dto.name.trim(),
      description: dto.description,
      color: dto.color,
    });

    return this.folderToDto(folder);
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
