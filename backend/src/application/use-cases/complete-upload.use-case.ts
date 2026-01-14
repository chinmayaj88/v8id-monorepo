/**
 * Complete Upload Use Case
 * 
 * Finalizes upload after all chunks are uploaded.
 * Creates file record, calculates hash, and updates user storage.
 */

import { IUploadSessionRepository } from '../interfaces/upload-session-repository.interface';
import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { IThumbnailService } from '../interfaces/thumbnail-service.interface';
import { File, FileStatus, FileType, StorageTier } from '../../domain/entities/file';
import { FileResponseDTO } from '../dtos/file.dto';
import { createHash } from 'crypto';
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service';

export interface CompleteUploadDTO {
  sessionId: string;
  name?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export class CompleteUploadUseCase {
  constructor(
    private uploadSessionRepository: IUploadSessionRepository,
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private userRepository: IUserRepository,
    private storageService: IStorageService,
    private thumbnailService: IThumbnailService,
    private storageCache?: StorageCacheService
  ) {}

  async execute(userId: string, dto: CompleteUploadDTO): Promise<FileResponseDTO> {
    const session = await this.uploadSessionRepository.findById(dto.sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Access denied');
    }

    if (session.isExpired()) {
      throw new Error('Upload session has expired');
    }

    if (!session.isFullyUploaded()) {
      throw new Error(`Upload incomplete. ${session.uploadedChunks}/${session.totalChunks} chunks uploaded.`);
    }

    // Get storage tier from session (default to STANDARD for backward compatibility)
    const storageTier = session.storageTier || StorageTier.STANDARD;
    const isTierAware = this.storageService instanceof TierAwareStorageService;

    if (session.isDirectUpload() && session.ociObjectName) {
      const exists = isTierAware
        ? await (this.storageService as TierAwareStorageService).fileExists(session.ociObjectName, storageTier)
        : await this.storageService.fileExists(session.ociObjectName);
      if (!exists) {
        throw new Error('File not found in storage. Upload may have failed.');
      }
    } else if (session.isBackendUpload()) {
      if (session.ociObjectName) {
        const exists = isTierAware
          ? await (this.storageService as TierAwareStorageService).fileExists(session.ociObjectName, storageTier)
          : await this.storageService.fileExists(session.ociObjectName);
        if (!exists) {
          throw new Error('File not found in storage. Backend chunked upload may have failed.');
        }
      }
    }

    let fileHash: string;
    let fileBuffer: Buffer | null = null;
    if (session.ociObjectName) {
      try {
        // Download from tier-specific bucket
        const fileData = isTierAware
          ? await (this.storageService as TierAwareStorageService).downloadFile(session.ociObjectName, storageTier)
          : await this.storageService.downloadFile(session.ociObjectName);
        fileBuffer = fileData.file;
        fileHash = createHash('sha256').update(fileBuffer).digest('hex');
      } catch (error) {
        throw new Error(`Failed to calculate file hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      throw new Error('OCI object name not set in upload session');
    }

    const existingFile = await this.fileRepository.findByHash(fileHash, userId);
    if (existingFile && existingFile.isActive()) {
      try {
        // Delete from tier-specific bucket
        if (isTierAware) {
          await (this.storageService as TierAwareStorageService).deleteFile(session.ociObjectName!, storageTier);
        } else {
          await this.storageService.deleteFile(session.ociObjectName!);
        }
      } catch (error) {
        // Failed to delete duplicate - non-critical
      }
      
      await this.uploadSessionRepository.delete(session.id);
      
      return this.fileToDto(existingFile);
    }

    const fileType = this.determineFileType(session.mimeType);

    const displayName = dto.name || session.fileName;

    const nameExists = await this.fileRepository.nameExistsInFolder(userId, session.folderId, displayName);
    let finalName = displayName;
    if (nameExists) {
      const ext = this.getFileExtension(session.fileName);
      const baseName = ext ? displayName.replace(new RegExp(`\\.${ext}$`, 'i'), '') : displayName;
      const timestamp = Date.now();
      finalName = ext ? `${baseName}-${timestamp}.${ext}` : `${baseName}-${timestamp}`;
    }

    let file: File;
    try {
      file = await this.fileRepository.create({
        userId,
        folderId: session.folderId,
        name: finalName,
        originalName: session.fileName,
        mimeType: session.mimeType,
        size: session.fileSize,
        type: fileType,
        status: FileStatus.ACTIVE,
        storageTier, // Use tier from session
        ociObjectName: session.ociObjectName!,
        hash: fileHash,
        description: dto.description,
        tags: dto.tags,
        metadata: dto.metadata,
      });
    } catch (error) {
      try {
        // Delete from tier-specific bucket
        if (isTierAware) {
          await (this.storageService as TierAwareStorageService).deleteFile(session.ociObjectName!, storageTier);
        } else {
          await this.storageService.deleteFile(session.ociObjectName!);
        }
      } catch (deleteError) {
        console.error(`Failed to delete file from ${storageTier} tier storage after database error:`, deleteError);
      }
      throw new Error(`Failed to create file record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.uploadSessionRepository.update(session.id, {
      isCompleted: true,
      hash: fileHash,
    });

    // Update storage - use cache if available
    let currentStorageUsed: bigint;
    const cachedStorage = this.storageCache?.get(userId);
    if (cachedStorage !== null && cachedStorage !== undefined) {
      // Use cached value and add new file size
      currentStorageUsed = cachedStorage + session.fileSize;
    } else {
      // Calculate from database
      currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    }
    
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });
    
    // Update cache
    this.storageCache?.set(userId, currentStorageUsed);

    if (session.parId) {
      try {
        await this.storageService.deletePreAuthenticatedRequest(session.parId);
      } catch (error) {
        // PAR deletion failed - non-critical
      }
    }

    // Generate thumbnail from already-downloaded buffer (efficient!)
    // Apply same optimizations as regular upload:
    // - Skip for ARCHIVE tier (lazy generation)
    // - Skip for very small files (< 10KB)
    // - Async for large files (> 50MB)
    if (storageTier === StorageTier.STANDARD && fileBuffer && this.thumbnailService.supportsThumbnail(session.mimeType)) {
      const fileSizeMB = Number(session.fileSize) / (1024 * 1024);
      const fileSizeKB = Number(session.fileSize) / 1024;

      // Skip thumbnail for very small files (< 10KB)
      if (fileSizeKB >= 10) {
        // For large files (> 50MB), generate asynchronously (non-blocking)
        if (fileSizeMB > 50) {
          this.generateThumbnailAsync(file.id, fileBuffer, session.ociObjectName!, storageTier).catch((error) => {
            console.error(`Failed to generate thumbnail for large file ${file.id}:`, error);
          });
        } else {
          // Generate synchronously for medium files
          try {
            await this.generateThumbnailSync(file.id, fileBuffer, session.ociObjectName!, storageTier);
          } catch (error) {
            // Thumbnail generation failed - non-critical
          }
        }
      }
    }

    return this.fileToDto(file);
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

  /**
   * Generate thumbnail synchronously
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

    const thumbnailObjectName = this.generateThumbnailObjectName(ociObjectName);

    // Upload thumbnail (always in STANDARD tier for fast access)
    const isTierAware = this.storageService instanceof TierAwareStorageService;
    await this.storageService.uploadFile({
      objectName: thumbnailObjectName,
      file: thumbnailResult.thumbnailBuffer,
      contentType: 'image/jpeg',
      tier: isTierAware ? StorageTier.STANDARD : undefined, // Thumbnails always in STANDARD tier
      metadata: {
        originalFileId: fileId,
        originalObjectName: ociObjectName,
        originalStorageTier: storageTier, // Track original file tier
        width: thumbnailResult.width.toString(),
        height: thumbnailResult.height.toString(),
        generatedAt: new Date().toISOString(),
      },
    });

    await this.fileRepository.update(fileId, {
      thumbnailObjectName,
      thumbnailGenerated: true,
    });

    // Free memory
    (thumbnailResult.thumbnailBuffer as any) = null;
  }

  /**
   * Generate thumbnail asynchronously (for large files)
   */
  private async generateThumbnailAsync(
    fileId: string,
    fileBuffer: Buffer,
    ociObjectName: string,
    storageTier: StorageTier
  ): Promise<void> {
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
   */
  private generateThumbnailObjectName(originalObjectName: string): string {
    const parts = originalObjectName.split('/');
    const filename = parts[parts.length - 1];
    const pathParts = parts.slice(0, -1);
    
    return [...pathParts, 'thumbnails', filename].join('/');
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
}
