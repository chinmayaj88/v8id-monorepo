/**
 * Regenerate Thumbnail Use Case
 * 
 * Manually regenerate thumbnail for a file.
 * Useful for retrying failed thumbnail generation or updating thumbnails.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { IThumbnailService } from '../interfaces/thumbnail-service.interface';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service';
import { StorageTier } from '../../domain/entities/file';

export interface RegenerateThumbnailResult {
  success: boolean;
  thumbnailObjectName?: string;
  error?: string;
}

export class RegenerateThumbnailUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private thumbnailService: IThumbnailService
  ) {}

  async execute(userId: string, fileId: string): Promise<RegenerateThumbnailResult> {
    try {
      const file = await this.fileRepository.findById(fileId);
      if (!file) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      if (file.userId !== userId) {
        return {
          success: false,
          error: 'Access denied',
        };
      }

      if (!this.thumbnailService.supportsThumbnail(file.mimeType)) {
        return {
          success: false,
          error: 'Thumbnail generation not supported for this file type',
        };
      }

      // Use tier-aware storage service
      const isTierAware = this.storageService instanceof TierAwareStorageService;
      const storageTier = file.storageTier || StorageTier.STANDARD;

      // Delete existing thumbnail if it exists (thumbnails are in STANDARD tier)
      if (file.thumbnailObjectName) {
        try {
          if (isTierAware) {
            await (this.storageService as TierAwareStorageService).deleteFile(
              file.thumbnailObjectName,
              StorageTier.STANDARD
            );
          } else {
            await this.storageService.deleteFile(file.thumbnailObjectName);
          }
        } catch (error) {
          // Failed to delete existing thumbnail - will be overwritten
          // Continue anyway
        }
      }

      // Download original file from tier-specific bucket
      const originalFile = isTierAware
        ? await (this.storageService as TierAwareStorageService).downloadFile(file.ociObjectName, storageTier)
        : await this.storageService.downloadFile(file.ociObjectName);

      // Generate new thumbnail
      const optimalDimensions = this.thumbnailService.getOptimalDimensions(file.mimeType);
      const thumbnailResult = await this.thumbnailService.generateImageThumbnail(
        originalFile.file,
        {
          width: optimalDimensions.width,
          height: optimalDimensions.height,
          quality: 85,
          format: 'jpeg',
        }
      );

      // Generate thumbnail object name
      const thumbnailObjectName = this.generateThumbnailObjectName(file.ociObjectName);

      // Upload thumbnail (always in STANDARD tier for fast access)
      await this.storageService.uploadFile({
        objectName: thumbnailObjectName,
        file: thumbnailResult.thumbnailBuffer,
        contentType: 'image/jpeg',
        tier: isTierAware ? StorageTier.STANDARD : undefined, // Thumbnails always in STANDARD tier
        metadata: {
          originalFileId: file.id,
          originalObjectName: file.ociObjectName,
          originalStorageTier: storageTier, // Track original file tier
          width: thumbnailResult.width.toString(),
          height: thumbnailResult.height.toString(),
          generatedAt: new Date().toISOString(),
          regenerated: 'true',
        },
      });

      // Update file record
      await this.fileRepository.update(file.id, {
        thumbnailObjectName,
        thumbnailGenerated: true,
      });

      // Free memory
      (originalFile.file as any) = null;
      (thumbnailResult.thumbnailBuffer as any) = null;

      return {
        success: true,
        thumbnailObjectName,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to regenerate thumbnail for file ${fileId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private generateThumbnailObjectName(originalObjectName: string): string {
    const parts = originalObjectName.split('/');
    const filename = parts[parts.length - 1];
    const pathParts = parts.slice(0, -1);
    return [...pathParts, 'thumbnails', filename].join('/');
  }
}
