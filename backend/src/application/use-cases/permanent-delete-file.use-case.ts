/**
 * Permanent Delete File Use Case
 * 
 * Handles permanent deletion of files from trash.
 * This permanently removes the file from storage and database.
 * Only files that are already soft-deleted (in trash) can be permanently deleted.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { FileStatus } from '../../domain/entities/file';

export class PermanentDeleteFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private userRepository: IUserRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, fileId: string): Promise<void> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify file is in trash (soft-deleted)
    if (file.status !== FileStatus.DELETED || !file.deletedAt) {
      throw new Error('File must be in trash before it can be permanently deleted. Delete the file first to move it to trash.');
    }

    // 4. Hard delete: remove from storage and database
    try {
      // Delete from storage
      const exists = await this.storageService.fileExists(file.ociObjectName);
      if (exists) {
        await this.storageService.deleteFile(file.ociObjectName);
      }
    } catch (error) {
      // Log error but continue with database deletion
      console.error('Failed to delete file from storage:', error);
    }

    // 5. Delete from database
    await this.fileRepository.hardDelete(fileId);

    // 6. Update user storage used (file is now removed from storage)
    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });
  }
}
