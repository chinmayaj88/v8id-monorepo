/**
 * Upload Folder Use Case
 *
 * Upload multiple files with preserved folder structure.
 * Creates folder hierarchy in database and uploads files to OCI with corresponding paths.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { IThumbnailService } from '../interfaces/thumbnail-service.interface.js';
import { File, FileStatus, FileType, StorageTier } from '../../domain/entities/file.js';
import { StorageCacheService } from '../../infrastructure/services/storage-cache.service.js';
import { createHash, randomUUID } from 'crypto';

export interface FolderUploadFileDTO {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  relativePath: string; // e.g., "folder1/subfolder/file.txt"
}

export interface UploadFolderDTO {
  parentFolderId?: string | null;
  storageTier?: StorageTier;
}

export interface UploadFolderResult {
  success: boolean;
  rootFolderId: string | null;
  foldersCreated: number;
  filesUploaded: number;
  totalSize: number;
  files: Array<{
    id: string;
    name: string;
    path: string;
    size: number;
  }>;
}

export class UploadFolderUseCase {
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
    dto: UploadFolderDTO,
    files: FolderUploadFileDTO[]
  ): Promise<UploadFolderResult> {
    if (!files || files.length === 0) {
      throw new Error('No files provided for folder upload');
    }

    // Get user for quota check
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate total size
    const totalSize = files.reduce((sum, f) => sum + f.buffer.length, 0);

    // Check storage quota
    const currentUsed = Number(user.storageUsed);
    const quota = Number(user.storageQuota);
    if (currentUsed + totalSize > quota) {
      throw new Error(
        `Storage quota exceeded. Available: ${quota - currentUsed} bytes, Required: ${totalSize} bytes`
      );
    }

    // Validate parent folder if provided
    if (dto.parentFolderId) {
      const parentFolder = await this.folderRepository.findById(dto.parentFolderId);
      if (!parentFolder || parentFolder.userId !== userId) {
        throw new Error('Parent folder not found or access denied');
      }
      if (parentFolder.isDeleted) {
        throw new Error('Cannot upload to deleted folder');
      }
    }

    // Extract folder structure from file paths
    const folderPaths = new Set<string>();
    for (const file of files) {
      const parts = file.relativePath.split('/');
      // Build all parent folder paths
      for (let i = 1; i < parts.length; i++) {
        folderPaths.add(parts.slice(0, i).join('/'));
      }
    }

    // Sort folder paths to ensure parents are created before children
    const sortedFolderPaths = Array.from(folderPaths).sort((a, b) => {
      const depthA = a.split('/').length;
      const depthB = b.split('/').length;
      return depthA - depthB;
    });

    // Map of folder path to folder ID
    const folderMap = new Map<string, string>();
    let rootFolderId: string | null = null;

    // Create folders
    for (const folderPath of sortedFolderPaths) {
      const parts = folderPath.split('/');
      const folderName = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');

      // Determine parent ID
      let parentId: string | null = dto.parentFolderId || null;
      if (parentPath && folderMap.has(parentPath)) {
        parentId = folderMap.get(parentPath)!;
      }

      // Check if folder already exists
      const folderNameStr = folderName || 'Untitled';
      const existingFolder = await this.folderRepository.findByName(
        userId,
        folderNameStr,
        parentId
      );
      let folderId: string;

      if (existingFolder) {
        folderId = existingFolder.id;
      } else {
        // Create new folder
        const newFolder = await this.folderRepository.create({
          userId,
          parentId: parentId,
          name: folderNameStr,
        });
        folderId = newFolder.id;
      }

      folderMap.set(folderPath, folderId);

      // Track root folder (first level folder)
      if (parts.length === 1 && !rootFolderId) {
        rootFolderId = folderId;
      }
    }

    // Upload files
    const uploadedFiles: Array<{ id: string; name: string; path: string; size: number }> = [];
    const storageTier = dto.storageTier || StorageTier.STANDARD;

    for (const file of files) {
      const parts = file.relativePath.split('/');
      const fileName = parts[parts.length - 1];
      const folderPath = parts.slice(0, -1).join('/');

      // Get folder ID for this file
      const folderId = folderPath ? folderMap.get(folderPath) || null : dto.parentFolderId || null;

      // Generate unique object name for OCI
      const timestamp = Date.now();
      const uniqueId = randomUUID();
      const fileNameStr = fileName || 'file';
      const sanitizedName = fileNameStr.replace(/[^a-zA-Z0-9.-]/g, '_');
      const ociObjectName = `${userId}/${timestamp}-${uniqueId}-${sanitizedName}`;

      // Calculate file hash
      const hash = createHash('sha256').update(file.buffer).digest('hex');

      // Upload to OCI
      await this.storageService.uploadFile({
        objectName: ociObjectName,
        file: file.buffer,
        contentType: file.mimeType,
        metadata: { userId, originalName: file.originalName },
        tier: storageTier,
      });

      // Determine file type
      const fileType = this.determineFileType(file.mimeType);

      // Create file record
      const newFile = await this.fileRepository.create({
        userId,
        folderId,
        name: fileNameStr,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: BigInt(file.buffer.length),
        type: fileType,
        status: FileStatus.ACTIVE,
        storageTier,
        ociObjectName,
        hash,
      });

      // Generate thumbnail for images only
      if (this.shouldGenerateThumbnail(file.mimeType)) {
        try {
          await this.generateThumbnail(newFile.id, file.buffer, ociObjectName, storageTier);
        } catch (error) {
          // Thumbnail generation failed, continue without it
          console.error(`[UploadFolder] Thumbnail generation failed for ${fileName}:`, error);
        }
      }

      uploadedFiles.push({
        id: newFile.id,
        name: fileNameStr,
        path: file.relativePath,
        size: file.buffer.length,
      });
    }

    // Update user storage
    await this.userRepository.update(userId, {
      storageUsed: BigInt(currentUsed + totalSize),
    });

    // Invalidate storage cache
    if (this.storageCache) {
      this.storageCache.invalidate(userId);
    }

    return {
      success: true,
      rootFolderId,
      foldersCreated: folderMap.size,
      filesUploaded: uploadedFiles.length,
      totalSize,
      files: uploadedFiles,
    };
  }

  private determineFileType(mimeType: string): FileType {
    const type = mimeType.toLowerCase();
    if (type.startsWith('image/')) return FileType.IMAGE;
    if (type.startsWith('video/')) return FileType.VIDEO;
    if (type.startsWith('audio/')) return FileType.AUDIO;
    if (
      type.includes('pdf') ||
      type.startsWith('text/') ||
      type.includes('document') ||
      type.includes('word')
    ) {
      return FileType.DOCUMENT;
    }
    if (
      type.includes('zip') ||
      type.includes('rar') ||
      type.includes('tar') ||
      type.includes('archive')
    ) {
      return FileType.ARCHIVE;
    }
    return FileType.OTHER;
  }

  private shouldGenerateThumbnail(mimeType: string): boolean {
    // Only generate thumbnails for images (skip videos)
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
    ];
    return supportedTypes.some(type => mimeType.toLowerCase().startsWith(type.split('/')[0] + '/'));
  }

  private async generateThumbnail(
    fileId: string,
    fileBuffer: Buffer,
    ociObjectName: string,
    storageTier: StorageTier
  ): Promise<void> {
    try {
      const result = await this.thumbnailService.generateImageThumbnail(fileBuffer, {
        width: 300,
        height: 300,
        quality: 85,
      });

      // Generate thumbnail object name
      const thumbnailObjectName = ociObjectName.replace(/\/([^/]+)$/, '/thumbnails/$1_thumb.jpg');

      // Upload thumbnail to OCI
      await this.storageService.uploadFile({
        objectName: thumbnailObjectName,
        file: result.thumbnailBuffer,
        contentType: 'image/jpeg',
        tier: storageTier,
      });

      // Update file record with thumbnail info
      await this.fileRepository.update(fileId, {
        thumbnailObjectName,
        thumbnailGenerated: true,
      });
    } catch (error) {
      // Log but don't fail the upload
      console.error(`[UploadFolder] Thumbnail generation error:`, error);
    }
  }
}
