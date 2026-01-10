/**
 * Delete File Use Case
 * 
 * Handles file deletion (soft delete) with proper authorization and storage cleanup.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { FileStatus } from '../../domain/entities/file';

export class DeleteFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private userRepository: IUserRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, fileId: string, hardDelete: boolean = false): Promise<void> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify file can be deleted
    if (!file.canBeDeleted() && !hardDelete) {
      throw new Error('File cannot be deleted');
    }

    if (hardDelete) {
      // Hard delete: remove from storage and database
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

      // Delete from database
      await this.fileRepository.hardDelete(fileId);
    } else {
      // Soft delete: mark as deleted but keep in storage
      await this.fileRepository.update(fileId, {
        status: FileStatus.DELETED,
        deletedAt: new Date(),
      });
    }

    // 4. Update user storage used
    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });
  }
}
