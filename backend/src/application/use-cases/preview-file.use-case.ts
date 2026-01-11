/**
 * Preview File Use Case
 * 
 * Generate preview URL or data for files (images, PDFs, documents).
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { IFileShareRepository } from '../interfaces/file-share-repository.interface';

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
    private fileShareRepository: IFileShareRepository
  ) {}

  async execute(userId: string, fileId: string): Promise<PreviewFileResult> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Check access (owner or shared)
    const isOwner = file.userId === userId;
    const hasShare = await this.fileShareRepository.hasAccess(userId, fileId, null);
    
    if (!isOwner && !hasShare) {
      throw new Error('Access denied');
    }

    // 3. Verify file is active
    if (!file.isActive()) {
      throw new Error('File is not available for preview');
    }

    // 4. Determine preview type
    const previewType = this.determinePreviewType(file.mimeType);

    // 5. Generate preview URL (presigned URL/PAR for direct access)
    let previewUrl: string | undefined;
    let canPreview = false;
    let message: string | undefined;

    if (previewType === 'image' || previewType === 'pdf' || previewType === 'document') {
      try {
        // Generate presigned URL for preview (read-only, expires in 1 hour)
        previewUrl = await this.storageService.generatePresignedUrl(file.ociObjectName, 3600);
        canPreview = true;
      } catch (error) {
        message = 'Failed to generate preview URL';
      }
    } else if (previewType === 'video' || previewType === 'audio') {
      // For video/audio, return direct download URL (browser can handle preview)
      try {
        previewUrl = await this.storageService.generatePresignedUrl(file.ociObjectName, 3600);
        canPreview = true;
        message = 'Video/audio preview available via browser player';
      } catch (error) {
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
    if (mimeType.includes('pdf') || 
        mimeType.includes('word') || 
        mimeType.includes('excel') || 
        mimeType.includes('powerpoint') ||
        mimeType.includes('document') ||
        mimeType.includes('text')) {
      return 'document';
    }
    return 'unsupported';
  }
}
