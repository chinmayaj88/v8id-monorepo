/**
 * Delete Folder Use Case
 * 
 * Handles folder deletion with validation for empty folders.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';

export class DeleteFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, folderId: string, hardDelete: boolean = false, forceDelete: boolean = false): Promise<void> {
    // 1. Find folder
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // 2. Verify ownership
    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify folder can be deleted
    if (!folder.canBeDeleted() && !hardDelete) {
      throw new Error('Folder cannot be deleted');
    }

    // 4. Check if folder has children (unless force delete)
    if (!forceDelete) {
      const hasChildren = await this.folderRepository.hasChildren(folderId);
      if (hasChildren) {
        throw new Error('Folder contains subfolders. Delete subfolders first or use force delete.');
      }

      // 5. Check if folder has files (unless force delete)
      const hasFiles = await this.folderRepository.hasFiles(folderId);
      if (hasFiles) {
        throw new Error('Folder contains files. Delete files first or use force delete.');
      }
    }

    if (hardDelete) {
      // Hard delete: permanently remove
      await this.folderRepository.hardDelete(folderId);
    } else {
      // Soft delete: mark as deleted
      await this.folderRepository.delete(folderId);
    }
  }
}
