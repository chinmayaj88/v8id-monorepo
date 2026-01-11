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
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!folder.isDeleted || !folder.deletedAt) {
      throw new Error('Folder must be in trash before it can be permanently deleted. Delete the folder first to move it to trash.');
    }

    const allFiles = await this.fileRepository.findByFolderIdRecursive(folderId);

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

    for (const file of allFiles) {
      await this.fileRepository.hardDelete(file.id);
    }

    await this.folderRepository.hardDeleteRecursive(folderId);

    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });
  }
}
