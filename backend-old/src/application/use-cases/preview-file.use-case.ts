/**
 * Preview File Use Case
 *
 * Generate preview URL or data for files (images, PDFs, documents).
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { IFileShareRepository } from '../interfaces/file-share-repository.interface.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';
import { UrlCacheService } from '../../infrastructure/services/url-cache.service.js';

export interface PreviewFileResult {
  previewUrl?: string;
  previewType: 'image' | 'pdf' | 'document' | 'video' | 'audio' | 'unsupported';
  canPreview: boolean;
  message?: string;
}

export class PreviewFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private fileShareRepository: IFileShareRepository,
    private urlCache?: UrlCacheService
  ) {}

  async execute(userId: string, fileId: string): Promise<PreviewFileResult> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    const isOwner = file.userId === userId;
    const hasShare = await this.fileShareRepository.hasAccess(userId, fileId, null);

    if (!isOwner && !hasShare) {
      throw new Error('Access denied');
    }

    if (!file.isActive()) {
      throw new Error('File is not available for preview');
    }

    const previewType = this.determinePreviewType(file.mimeType);

    // Use tier-aware storage service for presigned URL generation
    const isTierAware = this.storageService instanceof TierAwareStorageService;
    const storageTier = file.storageTier || ('STANDARD' as any);

    let previewUrl: string | undefined;
    let canPreview = false;
    let message: string | undefined;

    if (
      previewType === 'image' ||
      previewType === 'pdf' ||
      previewType === 'document' ||
      previewType === 'video' ||
      previewType === 'audio'
    ) {
      try {
        // Check cache first
        const cacheKey = `preview:${file.ociObjectName}`;
        const cachedUrl = this.urlCache?.get(cacheKey);

        if (cachedUrl) {
          previewUrl = cachedUrl;
          canPreview = true;
        } else {
          if (isTierAware) {
            previewUrl = await (
              this.storageService as TierAwareStorageService
            ).generatePresignedUrl(
              file.ociObjectName,
              604800, // 7 days
              storageTier
            );
          } else {
            previewUrl = await this.storageService.generatePresignedUrl(
              file.ociObjectName,
              604800 // 7 days
            );
          }

          if (previewUrl) {
            canPreview = true;
            // Cache for ~7 days minus buffer
            this.urlCache?.set(cacheKey, previewUrl, 600000);
          }
        }

        if (previewType === 'video' || previewType === 'audio') {
          message = 'Video/audio preview available via browser player';
        }
      } catch (_error) {
        message = 'Failed to generate preview URL';
      }
    } else {
      message = 'Preview not supported for this file type';
    }

    return {
      previewUrl,
      previewType,
      canPreview,
      message,
    };
  }

  private determinePreviewType(mimeType: string): PreviewFileResult['previewType'] {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }
    if (mimeType.includes('video/')) {
      return 'video';
    }
    if (mimeType.includes('audio/')) {
      return 'audio';
    }
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('powerpoint') ||
      mimeType.includes('document') ||
      mimeType.includes('text')
    ) {
      return 'document';
    }
    return 'unsupported';
  }
}
