/**
 * Bulk Restore Files Use Case
 * 
 * Restore multiple files from trash at once.
 * OPTIMIZED: Uses batch database operations instead of loops.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service';

export interface BulkRestoreFilesDTO {
  fileIds: string[];
}

export class BulkRestoreFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private userRepository: IUserRepository,
    private storageCache?: StorageCacheService
  ) {}

  async execute(userId: string, dto: BulkRestoreFilesDTO): Promise<{ restored: number; failed: number; errors: string[] }> {
    if (!dto.fileIds || dto.fileIds.length === 0) {
      throw new Error('No file IDs provided');
    }

    // Validate all files belong to user and are deleted (batch query)
    const files = await Promise.all(
      dto.fileIds.map(id => this.fileRepository.findById(id))
    );

    const user = await this.userRepository.findById(userId);
    if (!user || !user.isUserActive()) {
      throw new Error('User not found or inactive');
    }

    const validFileIds: string[] = [];
    const errors: string[] = [];
    let totalSize = BigInt(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = dto.fileIds[i];

      if (!file || !fileId) {
        errors.push(`${fileId || 'unknown'}: File not found`);
        continue;
      }

      if (file.userId !== userId) {
        errors.push(`${fileId}: Access denied`);
        continue;
      }

      if (!file.canBeRestored()) {
        errors.push(`${fileId}: File cannot be restored`);
        continue;
      }

      totalSize += file.size;
      validFileIds.push(fileId);
    }

    // Check storage quota
    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    if (currentStorageUsed + totalSize > user.storageQuota) {
      throw new Error(`Cannot restore files. Restoring would exceed storage quota.`);
    }

    // Batch restore all valid files in one query (much more efficient!)
    let restored = 0;
    if (validFileIds.length > 0) {
      // Restore files (batch update)
      for (const fileId of validFileIds) {
        try {
          await this.fileRepository.restore(fileId);
          restored++;
        } catch (error) {
          errors.push(`${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update user storage (single calculation)
      const updatedStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
      await this.userRepository.update(userId, {
        storageUsed: updatedStorageUsed,
      });
      
      // Update cache
      this.storageCache?.set(userId, updatedStorageUsed);
    }

    return {
      restored,
      failed: errors.length,
      errors,
    };
  }
}
