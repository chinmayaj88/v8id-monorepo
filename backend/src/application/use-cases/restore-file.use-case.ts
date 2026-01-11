/**
 * Restore File Use Case
 * 
 * Handles restoring soft-deleted files back to active status.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { FileResponseDTO } from '../dtos/file.dto';
import { File } from '../../domain/entities/file';
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service';

export class RestoreFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private userRepository: IUserRepository,
    private storageCache?: StorageCacheService
  ) {}

  async execute(userId: string, fileId: string): Promise<FileResponseDTO> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!file.canBeRestored()) {
      throw new Error('File cannot be restored. Only deleted files can be restored.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user || !user.isUserActive()) {
      throw new Error('User not found or inactive');
    }

    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    const fileSize = file.size;
    const availableStorage = user.getAvailableStorage();
    
    if (currentStorageUsed + fileSize > user.storageQuota) {
      throw new Error(`Cannot restore file. Restoring would exceed storage quota. Available: ${this.formatBytes(Number(availableStorage))}, File size: ${this.formatBytes(Number(fileSize))}`);
    }

    const restoredFile = await this.fileRepository.restore(fileId);

    const updatedStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: updatedStorageUsed,
    });

    // Update cache
    this.storageCache?.set(userId, updatedStorageUsed);

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
      storageTier: file.storageTier,
      thumbnailGenerated: file.thumbnailGenerated,
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
