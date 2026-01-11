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
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service';

export class PermanentDeleteFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private userRepository: IUserRepository,
    private storageService: IStorageService,
    private storageCache?: StorageCacheService
  ) {}

  async execute(userId: string, fileId: string): Promise<void> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    if (file.status !== FileStatus.DELETED || !file.deletedAt) {
      throw new Error('File must be in trash before it can be permanently deleted. Delete the file first to move it to trash.');
    }

    // Use tier-aware storage service for deletion
    const isTierAware = this.storageService instanceof TierAwareStorageService;
    const storageTier = file.storageTier || 'STANDARD' as any;

    try {
      const exists = isTierAware
        ? await (this.storageService as TierAwareStorageService).fileExists(file.ociObjectName, storageTier)
        : await this.storageService.fileExists(file.ociObjectName);
      
      if (exists) {
        if (isTierAware) {
          await (this.storageService as TierAwareStorageService).deleteFile(file.ociObjectName, storageTier);
        } else {
          await this.storageService.deleteFile(file.ociObjectName);
        }
      }
    } catch (error) {
      console.error(`Failed to delete file from ${storageTier} tier storage:`, error);
    }

    await this.fileRepository.hardDelete(fileId);

    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });

    // Update cache
    this.storageCache?.set(userId, currentStorageUsed);
  }
}
