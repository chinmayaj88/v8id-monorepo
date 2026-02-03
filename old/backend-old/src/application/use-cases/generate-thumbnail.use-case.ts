/**
 * Generate Thumbnail Use Case
 * 
 * Generates thumbnails for images asynchronously.
 * Optimized to not block file uploads - runs in background.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { IThumbnailService } from '../interfaces/thumbnail-service.interface.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';
import { StorageTier } from '../../domain/entities/file.js';

export interface GenerateThumbnailResult {
  success: boolean;
  thumbnailObjectName?: string;
  error?: string;
}

export class GenerateThumbnailUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private thumbnailService: IThumbnailService
  ) {}

  /**
   * Generate thumbnail for a file
   * This is designed to run asynchronously after file upload
   */
  async execute(fileId: string): Promise<GenerateThumbnailResult> {
    try {
      const file = await this.fileRepository.findById(fileId);
      if (!file) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      // Check if thumbnail generation is supported
      if (!this.thumbnailService.supportsThumbnail(file.mimeType)) {
        return {
          success: false,
          error: 'Thumbnail generation not supported for this file type',
        };
      }

      // Check if thumbnail already exists
      if (file.hasThumbnail()) {
        return {
          success: true,
          thumbnailObjectName: file.thumbnailObjectName,
        };
      }

      // Use tier-aware storage service for thumbnail operations
      const isTierAware = this.storageService instanceof TierAwareStorageService;
      const storageTier = file.storageTier || StorageTier.STANDARD;

      // Check if we can reuse thumbnail from duplicate file (deduplication)
      const duplicateFile = await this.fileRepository.findByHash(file.hash, file.userId);
      if (duplicateFile && duplicateFile.id !== file.id && duplicateFile.hasThumbnail()) {
        // Reuse thumbnail from duplicate file - saves processing and storage!
        const thumbnailObjectName = this.generateThumbnailObjectName(file.ociObjectName);
        
        // Copy thumbnail from duplicate file (thumbnails are always in STANDARD tier)
        if (duplicateFile.thumbnailObjectName) {
          if (isTierAware) {
            // Thumbnails are always in STANDARD tier for fast access
            await (this.storageService as TierAwareStorageService).copyFile(
              duplicateFile.thumbnailObjectName,
              thumbnailObjectName,
              StorageTier.STANDARD
            );
          } else {
            await this.storageService.copyFile(duplicateFile.thumbnailObjectName, thumbnailObjectName);
          }
          
          await this.fileRepository.update(file.id, {
            thumbnailObjectName,
            thumbnailGenerated: true,
          });

          return {
            success: true,
            thumbnailObjectName,
          };
        }
      }

      // Download the original file from tier-specific bucket
      const originalFile = isTierAware
        ? await (this.storageService as TierAwareStorageService).downloadFile(file.ociObjectName, storageTier)
        : await this.storageService.downloadFile(file.ociObjectName);

      // Generate thumbnail
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

      // Free original file buffer immediately to save memory
      (originalFile.file as any) = null;

      // Generate thumbnail object name
      const thumbnailObjectName = this.generateThumbnailObjectName(file.ociObjectName);

      // Upload thumbnail to storage (always in STANDARD tier for fast access)
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
        },
      });

      // Update file record with thumbnail info
      await this.fileRepository.update(file.id, {
        thumbnailObjectName,
        thumbnailGenerated: true,
      });

      return {
        success: true,
        thumbnailObjectName,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to generate thumbnail for file ${fileId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate thumbnail object name based on original file path
   * Example: users/123/files/image.jpg -> users/123/thumbnails/image.jpg
   */
  private generateThumbnailObjectName(originalObjectName: string): string {
    const parts = originalObjectName.split('/');
    const filename = parts[parts.length - 1];
    const pathParts = parts.slice(0, -1);
    
    // Insert 'thumbnails' directory before filename
    return [...pathParts, 'thumbnails', filename].join('/');
  }

  /**
   * Generate thumbnail for multiple files (batch processing)
   */
  async executeBatch(fileIds: string[]): Promise<Map<string, GenerateThumbnailResult>> {
    const results = new Map<string, GenerateThumbnailResult>();

    // Process in parallel with concurrency limit to avoid overwhelming the system
    const concurrencyLimit = 5;
    const chunks: string[][] = [];
    
    for (let i = 0; i < fileIds.length; i += concurrencyLimit) {
      chunks.push(fileIds.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (fileId) => {
          const result = await this.execute(fileId);
          return { fileId, result };
        })
      );

      for (const { fileId, result } of chunkResults) {
        results.set(fileId, result);
      }
    }

    return results;
  }
}
