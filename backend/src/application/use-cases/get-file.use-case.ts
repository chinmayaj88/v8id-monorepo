/**
 * Get File Use Case
 * 
 * Retrieves file metadata by ID.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { FileResponseDTO } from '../dtos/file.dto';
import { UrlCacheService } from '../../infrastructure/services/url-cache.service';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service';
import { StorageTier } from '../../domain/entities/file';

export class GetFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private urlCache?: UrlCacheService
  ) {}

  async execute(userId: string, fileId: string): Promise<FileResponseDTO> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    let thumbnailUrl: string | undefined;
    
    // Generate presigned URL for thumbnail if it exists
    // Thumbnails are always stored in STANDARD tier for fast access
    if (file.hasThumbnail() && file.thumbnailObjectName) {
      try {
        // Check cache first (reduces OCI API calls)
        const cacheKey = `thumbnail:${file.thumbnailObjectName}`;
        const cachedUrl = this.urlCache?.get(cacheKey);
        
        if (cachedUrl) {
          thumbnailUrl = cachedUrl;
        } else {
          // Use tier-aware storage service - thumbnails are always in STANDARD tier
          const isTierAware = this.storageService instanceof TierAwareStorageService;
          
          if (isTierAware) {
            // Thumbnails are always in STANDARD tier for performance
            thumbnailUrl = await (this.storageService as TierAwareStorageService).generatePresignedUrl(
              file.thumbnailObjectName,
              86400, // 24 hours
              StorageTier.STANDARD
            );
          } else {
            thumbnailUrl = await this.storageService.generatePresignedUrl(
              file.thumbnailObjectName,
              86400 // 24 hours
            );
          }
          
          // Cache for 20 hours
          this.urlCache?.set(cacheKey, thumbnailUrl, 72000);
        }
      } catch (error) {
        // Thumbnail URL generation failed - non-critical
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
}
