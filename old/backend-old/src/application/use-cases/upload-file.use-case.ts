/**
 * Upload File Use Case
 * 
 * Handles file upload logic including validation, storage, and metadata creation.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { IThumbnailService } from '../interfaces/thumbnail-service.interface.js';
import { UploadFileDTO } from '../dtos/file.dto.js';
import { File, FileStatus, FileType, StorageTier } from '../../domain/entities/file.js';
import { createHash } from 'crypto';
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service.js';

export interface UploadFileResult {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  ociObjectName: string;
  status: FileStatus;
}

export class UploadFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private userRepository: IUserRepository,
    private storageService: IStorageService,
    private thumbnailService: IThumbnailService,
    private storageCache?: StorageCacheService
  ) {}

  async execute(
    userId: string,
    dto: UploadFileDTO,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<UploadFileResult> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isUserActive()) {
      throw new Error('User not found or inactive');
    }

    const fileSize = BigInt(fileBuffer.length);
    if (user.hasExceededStorageQuota()) {
      throw new Error('Storage quota exceeded');
    }

    const availableStorage = user.getAvailableStorage();
    if (fileSize > availableStorage) {
      throw new Error(`Insufficient storage. Available: ${this.formatBytes(Number(availableStorage))}, Required: ${this.formatBytes(Number(fileSize))}`);
    }

    if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== userId || !folder.isActive()) {
        throw new Error('Folder not found or access denied');
      }
    }

    const hash = createHash('sha256').update(fileBuffer).digest('hex');

    const existingFile = await this.fileRepository.findByHash(hash, userId);
    let ociObjectName: string;
    let shouldUploadToStorage = true;

    if (existingFile && existingFile.isActive()) {
      ociObjectName = existingFile.ociObjectName;
      shouldUploadToStorage = false;
      
      try {
        const exists = await this.storageService.fileExists(ociObjectName);
        if (!exists) {
          shouldUploadToStorage = true;
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          ociObjectName = `users/${userId}/files/${timestamp}-${randomString}-${originalFilename}`;
        }
      } catch (error) {
        shouldUploadToStorage = true;
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        ociObjectName = `users/${userId}/files/${timestamp}-${randomString}-${originalFilename}`;
      }
    } else {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      ociObjectName = `users/${userId}/files/${timestamp}-${randomString}-${originalFilename}`;
    }

    const fileType = this.determineFileType(mimeType);
    
    // Determine storage tier (default to STANDARD for backward compatibility)
    const storageTier = dto.storageTier || StorageTier.STANDARD;

    const displayName = dto.name || originalFilename;

    const nameExists = await this.fileRepository.nameExistsInFolder(userId, dto.folderId || null, displayName);
    if (nameExists) {
      const ext = this.getFileExtension(originalFilename);
      const baseName = ext ? displayName.replace(new RegExp(`\\.${ext}$`, 'i'), '') : displayName;
      const timestamp = Date.now();
      const uniqueName = ext ? `${baseName}-${timestamp}.${ext}` : `${baseName}-${timestamp}`;
      Object.assign(dto, { name: uniqueName });
    }

    if (shouldUploadToStorage) {
      try {
        // Upload to tier-specific bucket
        await this.storageService.uploadFile({
          objectName: ociObjectName,
          file: fileBuffer,
          contentType: mimeType,
          tier: storageTier, // Pass tier to storage service
          metadata: {
            userId,
            originalFilename,
            uploadDate: new Date().toISOString(),
            hash,
            storageTier, // Store tier in metadata for reference
          },
        });
      } catch (error) {
        throw new Error(`Failed to upload file to ${storageTier} tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    let file: File;
    try {
      file = await this.fileRepository.create({
        userId,
        folderId: dto.folderId || null,
        name: dto.name || displayName,
        originalName: originalFilename,
        mimeType,
        size: fileSize,
        type: fileType,
        status: FileStatus.ACTIVE,
        storageTier, // Store tier in database
        ociObjectName,
        hash,
        description: dto.description,
        tags: dto.tags,
        metadata: dto.metadata,
      });
    } catch (error) {
      if (shouldUploadToStorage) {
        try {
          await this.storageService.deleteFile(ociObjectName);
        } catch (deleteError) {
          console.error('Failed to delete file from storage after database error:', deleteError);
        }
      }
      throw new Error(`Failed to create file record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Update storage - use cache if available
    let currentStorageUsed: bigint;
    const cachedStorage = this.storageCache?.get(userId);
    if (cachedStorage !== null && cachedStorage !== undefined) {
      // Use cached value and add new file size
      currentStorageUsed = cachedStorage + fileSize;
    } else {
      // Calculate from database
      currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    }
    
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });
    
    // Update cache
    this.storageCache?.set(userId, currentStorageUsed);

    // Generate thumbnail with enterprise-grade optimizations:
    // 1. Skip for ARCHIVE tier (lazy generation - generate on-demand when browsing)
    // 2. Skip for very small files (< 10KB) - not worth it
    // 3. Skip for very large files (> 50MB) - generate async to not block upload
    // 4. Generate synchronously for medium files (10KB - 50MB) in STANDARD tier only
    // 
    // Cost optimization: Archive tier files skip thumbnail generation during upload
    // to reduce server load, bandwidth, and storage costs. Thumbnails can be generated
    // on-demand when users browse archive files.
    if (storageTier === StorageTier.STANDARD && this.thumbnailService.supportsThumbnail(mimeType)) {
      const fileSizeMB = Number(fileSize) / (1024 * 1024);
      const fileSizeKB = Number(fileSize) / 1024;

      // Skip thumbnail for very small files (< 10KB) - not worth the processing
      if (fileSizeKB >= 10) {
        // For large files (> 50MB), generate thumbnail asynchronously to not block upload
        // This prevents server blocking and improves user experience
        if (fileSizeMB > 50) {
          // Fire and forget for large files - non-blocking async operation
          this.generateThumbnailAsync(file.id, fileBuffer, ociObjectName, storageTier).catch((error) => {
            console.error(`Failed to generate thumbnail for large file ${file.id}:`, error);
          });
        } else {
          // Generate synchronously for medium files (10KB - 50MB)
          // These are small enough to process quickly without blocking
          try {
            await this.generateThumbnailSync(file.id, fileBuffer, ociObjectName, storageTier);
          } catch (error) {
            // Thumbnail generation failed - non-critical, continue
          }
        }
      }
    }

    return {
      id: file.id,
      name: file.name,
      size: Number(file.size),
      mimeType: file.mimeType,
      ociObjectName: file.ociObjectName,
      status: file.status,
    };
  }

  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return FileType.VIDEO;
    }
    if (mimeType.startsWith('audio/')) {
      return FileType.AUDIO;
    }
    if (mimeType.includes('pdf') || 
        mimeType.includes('word') || 
        mimeType.includes('excel') || 
        mimeType.includes('powerpoint') ||
        mimeType.includes('document') ||
        mimeType.includes('text')) {
      return FileType.DOCUMENT;
    }
    if (mimeType.includes('zip') || 
        mimeType.includes('rar') || 
        mimeType.includes('tar') || 
        mimeType.includes('gzip')) {
      return FileType.ARCHIVE;
    }
    return FileType.OTHER;
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      const extension = parts[parts.length - 1];
      return extension || '';
    }
    return '';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate thumbnail synchronously (for medium files)
   * Optimized for STANDARD tier files
   */
  private async generateThumbnailSync(
    fileId: string,
    fileBuffer: Buffer,
    ociObjectName: string,
    storageTier: StorageTier
  ): Promise<void> {
    const optimalDimensions = this.thumbnailService.getOptimalDimensions('image/jpeg');
    const thumbnailResult = await this.thumbnailService.generateImageThumbnail(fileBuffer, {
      width: optimalDimensions.width,
      height: optimalDimensions.height,
      quality: 85,
      format: 'jpeg',
    });

    // Generate thumbnail object name
    const thumbnailObjectName = this.generateThumbnailObjectName(ociObjectName);

    // Upload thumbnail to storage (always in STANDARD tier for fast access)
    // Thumbnails are small and frequently accessed, so they should always be in STANDARD tier
    await this.storageService.uploadFile({
      objectName: thumbnailObjectName,
      file: thumbnailResult.thumbnailBuffer,
      contentType: 'image/jpeg',
      tier: StorageTier.STANDARD, // Thumbnails always in STANDARD tier for performance
      metadata: {
        originalFileId: fileId,
        originalObjectName: ociObjectName,
        width: thumbnailResult.width.toString(),
        height: thumbnailResult.height.toString(),
        generatedAt: new Date().toISOString(),
        originalStorageTier: storageTier, // Track original file tier
      },
    });

    // Update file record with thumbnail info
    await this.fileRepository.update(fileId, {
      thumbnailObjectName,
      thumbnailGenerated: true,
    });

    // Free memory immediately
    (thumbnailResult.thumbnailBuffer as any) = null;
  }

  /**
   * Generate thumbnail asynchronously (for large files)
   * Non-blocking operation to prevent server blocking
   */
  private async generateThumbnailAsync(
    fileId: string,
    fileBuffer: Buffer,
    ociObjectName: string,
    storageTier: StorageTier
  ): Promise<void> {
    // Use setImmediate to defer execution and not block upload response
    // This ensures the upload API responds quickly while thumbnail generates in background
    setImmediate(async () => {
      try {
        await this.generateThumbnailSync(fileId, fileBuffer, ociObjectName, storageTier);
      } catch (error) {
        console.error(`Async thumbnail generation failed for file ${fileId}:`, error);
      }
    });
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
}
