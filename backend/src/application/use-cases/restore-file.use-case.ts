/**
 * Restore File Use Case
 * 
 * Handles restoring soft-deleted files back to active status.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { FileResponseDTO } from '../dtos/file.dto';
import { File } from '../../domain/entities/file';

export class RestoreFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, fileId: string): Promise<FileResponseDTO> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify file can be restored
    if (!file.canBeRestored()) {
      throw new Error('File cannot be restored. Only deleted files can be restored.');
    }

    // 4. Verify user exists and is active
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isUserActive()) {
      throw new Error('User not found or inactive');
    }

    // 5. Check if restoring would exceed storage quota
    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    const fileSize = file.size;
    const availableStorage = user.getAvailableStorage();
    
    // If file was soft deleted, storage wasn't actually freed, so we need to check
    // if adding this file back (if it wasn't already counted) would exceed quota
    // Actually, since it's soft delete, storageUsed should still include it, so we can restore safely
    // But let's double-check available storage just in case
    if (currentStorageUsed + fileSize > user.storageQuota) {
      throw new Error(`Cannot restore file. Restoring would exceed storage quota. Available: ${this.formatBytes(Number(availableStorage))}, File size: ${this.formatBytes(Number(fileSize))}`);
    }

    // 6. Restore file
    const restoredFile = await this.fileRepository.restore(fileId);

    // 7. Update user storage used (recalculate to ensure accuracy)
    const updatedStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: updatedStorageUsed,
    });

    return this.fileToDto(restoredFile);
  }

  private fileToDto(file: File): FileResponseDTO {
    return {
      id: file.id,
      userId: file.userId,
      folderId: file.folderId,
      name: file.name,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
      type: file.type,
      status: file.status,
      description: file.description,
      tags: file.tags,
      metadata: file.metadata,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      deletedAt: file.deletedAt?.toISOString(),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
