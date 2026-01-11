/**
 * Permanent Delete Folder Use Case
 * 
 * Handles permanent deletion of folders from trash.
 * This permanently removes the folder and all its contents from the database.
 * Only folders that are already soft-deleted (in trash) can be permanently deleted.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';

export class PermanentDeleteFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository,
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, folderId: string): Promise<void> {
    // 1. Find folder
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // 2. Verify ownership
    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify folder is in trash (soft-deleted)
    if (!folder.isDeleted || !folder.deletedAt) {
      throw new Error('Folder must be in trash before it can be permanently deleted. Delete the folder first to move it to trash.');
    }

    // 4. Get all files in this folder and subfolders (recursively)
    const allFiles = await this.fileRepository.findByFolderIdRecursive(folderId);

    // 5. Delete all files from storage
    for (const file of allFiles) {
      try {
        const exists = await this.storageService.fileExists(file.ociObjectName);
        if (exists) {
          await this.storageService.deleteFile(file.ociObjectName);
        }
      } catch (error) {
        console.error(`Failed to delete file ${file.id} from storage:`, error);
      }
    }

    // 6. Hard delete all files from database
    for (const file of allFiles) {
      await this.fileRepository.hardDelete(file.id);
    }

    // 7. Hard delete folder and all subfolders recursively
    await this.folderRepository.hardDeleteRecursive(folderId);

    // 8. Update user storage used (files are now removed from storage)
    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });
  }
}
