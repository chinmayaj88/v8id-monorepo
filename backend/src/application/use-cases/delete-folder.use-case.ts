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
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!folder.canBeDeleted()) {
      throw new Error('Folder cannot be deleted. Folder is already in trash. Use permanent delete to remove it completely.');
    }

    if (!forceDelete) {
      const hasActiveChildren = await this.folderRepository.hasChildren(folderId);
      if (hasActiveChildren) {
        throw new Error('Folder contains active subfolders. Delete subfolders first or use force delete.');
      }

      const hasActiveFiles = await this.folderRepository.hasFiles(folderId);
      if (hasActiveFiles) {
        throw new Error('Folder contains active files. Delete files first or use force delete.');
      }
    }

    await this.folderRepository.delete(folderId);
  }
}
