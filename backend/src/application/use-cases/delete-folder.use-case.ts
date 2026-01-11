/**
 * Delete Folder Use Case
 * 
 * Handles folder deletion (soft delete) - moves folder to trash.
 * Folders are always soft deleted and can be restored from trash.
 * Use PermanentDeleteFolderUseCase to permanently delete from trash.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';

export class DeleteFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, folderId: string, forceDelete: boolean = false): Promise<void> {
    // 1. Find folder
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // 2. Verify ownership
    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify folder can be deleted (not already deleted)
    if (!folder.canBeDeleted()) {
      throw new Error('Folder cannot be deleted. Folder is already in trash. Use permanent delete to remove it completely.');
    }

    // 4. Check if folder has active children (unless force delete)
    if (!forceDelete) {
      const hasActiveChildren = await this.folderRepository.hasChildren(folderId);
      if (hasActiveChildren) {
        throw new Error('Folder contains active subfolders. Delete subfolders first or use force delete.');
      }

      // 5. Check if folder has active files (unless force delete)
      const hasActiveFiles = await this.folderRepository.hasFiles(folderId);
      if (hasActiveFiles) {
        throw new Error('Folder contains active files. Delete files first or use force delete.');
      }
    }

    // 6. Soft delete: mark as deleted (move to trash)
    await this.folderRepository.delete(folderId);
  }
}
