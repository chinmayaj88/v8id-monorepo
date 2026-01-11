/**
 * Get Folder Use Case
 * 
 * Retrieves folder metadata by ID.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { FolderResponseDTO } from '../dtos/file.dto';

export class GetFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, folderId: string): Promise<FolderResponseDTO> {
    // 1. Find folder
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // 2. Verify ownership
    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Return folder DTO
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
