/**
 * Restore Folder Use Case
 * 
 * Handles restoring soft-deleted folders back to active status.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { FolderResponseDTO } from '../dtos/file.dto';
import { Folder } from '../../domain/entities/folder';

export class RestoreFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, folderId: string): Promise<FolderResponseDTO> {
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!folder.canBeRestored()) {
      throw new Error('Folder cannot be restored. Only deleted folders can be restored.');
    }

    if (folder.parentId) {
      const parent = await this.folderRepository.findById(folder.parentId);
      if (parent && parent.isDeleted) {
        throw new Error('Cannot restore folder. Parent folder is also deleted. Restore parent folder first.');
      }
    }

    const nameExists = await this.folderRepository.nameExistsInParent(
      userId,
      folder.parentId,
      folder.name
    );
    if (nameExists) {
      throw new Error(`Cannot restore folder. A folder with name "${folder.name}" already exists in the parent folder.`);
    }

    const restoredFolder = await this.folderRepository.restore(folderId);

    return this.folderToDto(restoredFolder);
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
