/**
 * Permanent Delete Folder Use Case
 * 
 * Handles permanent deletion of folders from trash.
 * This permanently removes the folder and all its contents from the database.
 * Only folders that are already soft-deleted (in trash) can be permanently deleted.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';

export class PermanentDeleteFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository,
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private userRepository: IUserRepository,
    private storageCache?: StorageCacheService
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

    // OPTIMIZED: Delete files from storage in parallel (batch) - tier-aware
    const isTierAware = this.storageService instanceof TierAwareStorageService;
    const deletePromises = allFiles.map(async (file) => {
      try {
        const storageTier = file.storageTier || 'STANDARD' as any;
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
        console.error(`Failed to delete file ${file.id} from ${file.storageTier || 'STANDARD'} tier storage:`, error);
      }
    });
    await Promise.all(deletePromises);

    // OPTIMIZED: Batch delete files from database (single query!)
    const fileIds = allFiles.map(f => f.id);
    if (fileIds.length > 0) {
      await this.fileRepository.batchHardDelete(fileIds);
    }

    await this.folderRepository.hardDeleteRecursive(folderId);

    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });
    
    // Update cache
    this.storageCache?.set(userId, currentStorageUsed);
  }
}
