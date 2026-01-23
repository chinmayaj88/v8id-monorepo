/**
 * Get Dashboard Data Use Case
 *
 * Fetches unified dashboard data for the home screen:
 * - Storage usage statistics
 * - Recent files with thumbnails
 * - Quick access folders (root folders)
 * - Summary counts
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { UrlCacheService } from '../../infrastructure/services/url-cache.service.js';
import { DashboardResponseDTO } from '../dtos/dashboard.dto.js';
import { File, StorageTier } from '../../domain/entities/file.js';
import { Folder } from '../../domain/entities/folder.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';
import { FileResponseDTO, FolderResponseDTO } from '../dtos/file.dto.js';

export class GetDashboardDataUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private userRepository: IUserRepository,
    private storageService: IStorageService,
    private urlCache?: UrlCacheService
  ) {}

  async execute(userId: string): Promise<DashboardResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 1. Fetch data in parallel for performance
    const [recentFilesData, rootFoldersData, allFoldersData] = await Promise.all([
      this.fileRepository.findByUserId(userId, {
        limit: 10,
        orderBy: 'updatedAt',
        orderDirection: 'desc',
      }),
      this.folderRepository.findRootFolders(userId, {
        limit: 4,
      }),
      this.folderRepository.findByUserId(userId, {
        limit: 1,
      }),
    ]);

    // 2. Map and process Thumbnails for recent files
    const recentFiles = await Promise.all(recentFilesData.files.map(file => this.fileToDto(file)));

    // 3. Map Folders
    const folders: FolderResponseDTO[] = rootFoldersData.folders.map(f => this.folderToDto(f));

    // 4. Calculate Storage Stats
    const totalStorage = Number(user.storageQuota);
    const usedStorage = Number(user.storageUsed);
    const percentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

    return {
      storage: {
        total: totalStorage,
        used: usedStorage,
        percentage: Math.round(percentage * 10) / 10,
      },
      recentFiles,
      folders,
      stats: {
        totalFiles: recentFilesData.total,
        totalFolders: allFoldersData.total,
      },
    };
  }

  private async fileToDto(file: File): Promise<FileResponseDTO> {
    let thumbnailUrl: string | undefined;

    if (file.hasThumbnail() && file.thumbnailObjectName) {
      try {
        const cacheKey = `thumbnail:${file.thumbnailObjectName}`;
        const cachedUrl = this.urlCache?.get(cacheKey);

        if (cachedUrl) {
          thumbnailUrl = cachedUrl;
        } else {
          const isTierAware = this.storageService instanceof TierAwareStorageService;

          if (isTierAware) {
            thumbnailUrl = await (
              this.storageService as TierAwareStorageService
            ).generatePresignedUrl(file.thumbnailObjectName, 604800, StorageTier.STANDARD);
          } else {
            thumbnailUrl = await this.storageService.generatePresignedUrl(
              file.thumbnailObjectName,
              604800
            );
          }

          this.urlCache?.set(cacheKey, thumbnailUrl, 600000); // ~7 days minus buffer
        }
      } catch (error) {
        // Non-critical error
      }
    }

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
      thumbnailUrl,
      thumbnailGenerated: file.thumbnailGenerated,
      description: file.description,
      tags: file.tags,
      metadata: file.metadata,
      expiresAt: file.expiresAt?.toISOString(),
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      deletedAt: file.deletedAt?.toISOString(),
    };
  }

  private folderToDto(folder: Folder): FolderResponseDTO {
    return {
      id: folder.id,
      userId: folder.userId,
      parentId: folder.parentId,
      name: folder.name,
      description: folder.description,
      color: folder.color,
      isDeleted: !!folder.deletedAt,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
      deletedAt: folder.deletedAt?.toISOString(),
    };
  }
}
