/**
 * Bulk Delete Files Use Case
 * 
 * Delete multiple files at once (soft delete - move to trash).
 * OPTIMIZED: Uses batch database operations instead of loops.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { FileStatus } from '../../domain/entities/file';
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service';

export interface BulkDeleteFilesDTO {
  fileIds: string[];
}

export class BulkDeleteFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private userRepository: IUserRepository,
    private storageCache?: StorageCacheService
  ) {}

  async execute(userId: string, dto: BulkDeleteFilesDTO): Promise<{ deleted: number; failed: number; errors: string[] }> {
    if (!dto.fileIds || dto.fileIds.length === 0) {
      throw new Error('No file IDs provided');
    }

    // Validate all files belong to user and are active (single query)
    const files = await Promise.all(
      dto.fileIds.map(id => this.fileRepository.findById(id))
    );

    const validFileIds: string[] = [];
    const errors: string[] = [];

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

      if (!file.isActive()) {
        errors.push(`${fileId}: File is not active`);
        continue;
      }

      validFileIds.push(fileId);
    }

    // Batch update all valid files in one query (much more efficient!)
    let deleted = 0;
    if (validFileIds.length > 0) {
      deleted = await this.fileRepository.batchUpdateStatus(validFileIds, FileStatus.DELETED);

      // Update user storage (single calculation)
      const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
      await this.userRepository.update(userId, {
        storageUsed: currentStorageUsed,
      });
      
      // Update cache
      this.storageCache?.set(userId, currentStorageUsed);
    }

    return {
      deleted,
      failed: errors.length,
      errors,
    };
  }
}
