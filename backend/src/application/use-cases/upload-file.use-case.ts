/**
 * Upload File Use Case
 * 
 * Handles file upload logic including validation, storage, and metadata creation.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { UploadFileDTO } from '../dtos/file.dto';
import { File, FileStatus, FileType } from '../../domain/entities/file';
import { createHash } from 'crypto';

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
    private storageService: IStorageService
  ) {}

  async execute(
    userId: string,
    dto: UploadFileDTO,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<UploadFileResult> {
    // 1. Verify user exists and is active
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isUserActive()) {
      throw new Error('User not found or inactive');
    }

    // 2. Check storage quota
    const fileSize = BigInt(fileBuffer.length);
    if (user.hasExceededStorageQuota()) {
      throw new Error('Storage quota exceeded');
    }

    const availableStorage = user.getAvailableStorage();
    if (fileSize > availableStorage) {
      throw new Error(`Insufficient storage. Available: ${this.formatBytes(Number(availableStorage))}, Required: ${this.formatBytes(Number(fileSize))}`);
    }

    // 3. Validate folder if provided
    if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== userId || !folder.isActive()) {
        throw new Error('Folder not found or access denied');
      }
    }

    // 4. Calculate file hash for deduplication
    const hash = createHash('sha256').update(fileBuffer).digest('hex');

    // 5. Check for duplicate file (same hash and user) for storage reuse
    const existingFile = await this.fileRepository.findByHash(hash, userId);
    let ociObjectName: string;
    let shouldUploadToStorage = true;

    if (existingFile && existingFile.isActive()) {
      // File with same hash exists - reuse the OCI storage object
      // This saves storage space and upload time for duplicate files
      ociObjectName = existingFile.ociObjectName;
      shouldUploadToStorage = false;
      
      // Verify the file still exists in storage (defensive check)
      try {
        const exists = await this.storageService.fileExists(ociObjectName);
        if (!exists) {
          // File was deleted from storage, need to re-upload
          shouldUploadToStorage = true;
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          ociObjectName = `users/${userId}/files/${timestamp}-${randomString}-${originalFilename}`;
        }
      } catch (error) {
        // If check fails, upload to be safe
        console.warn('Failed to verify existing file in storage, will upload new copy:', error);
        shouldUploadToStorage = true;
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        ociObjectName = `users/${userId}/files/${timestamp}-${randomString}-${originalFilename}`;
      }
    } else {
      // No duplicate found, generate new OCI object name
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      ociObjectName = `users/${userId}/files/${timestamp}-${randomString}-${originalFilename}`;
    }

    // 6. Determine file type from mime type
    const fileType = this.determineFileType(mimeType);

    // 7. Determine display name
    const displayName = dto.name || originalFilename;

    // 8. Check if file name already exists in folder
    const nameExists = await this.fileRepository.nameExistsInFolder(userId, dto.folderId || null, displayName);
    if (nameExists) {
      // Generate unique name by appending timestamp
      const ext = this.getFileExtension(originalFilename);
      const baseName = ext ? displayName.replace(new RegExp(`\\.${ext}$`, 'i'), '') : displayName;
      const timestamp = Date.now();
      const uniqueName = ext ? `${baseName}-${timestamp}.${ext}` : `${baseName}-${timestamp}`;
      // Update displayName
      Object.assign(dto, { name: uniqueName });
    }

    // 9. Upload to OCI Object Storage (only if not reusing existing storage)
    if (shouldUploadToStorage) {
      try {
        await this.storageService.uploadFile({
          objectName: ociObjectName,
          file: fileBuffer,
          contentType: mimeType,
          metadata: {
            userId,
            originalFilename,
            uploadDate: new Date().toISOString(),
            hash, // Store hash in metadata for future reference
          },
        });
      } catch (error) {
        throw new Error(`Failed to upload file to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    // Else: Reusing existing storage - skip upload, just use existing ociObjectName

    // 10. Create file record in database
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
        status: FileStatus.ACTIVE, // Mark as active after successful upload
        ociObjectName,
        hash,
        description: dto.description,
        tags: dto.tags,
        metadata: dto.metadata,
      });
    } catch (error) {
      // Rollback: delete from storage if database creation fails (only if we uploaded)
      if (shouldUploadToStorage) {
        try {
          await this.storageService.deleteFile(ociObjectName);
        } catch (deleteError) {
          // Log error but don't throw - database error is more important
          console.error('Failed to delete file from storage after database error:', deleteError);
        }
      }
      throw new Error(`Failed to create file record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 11. Update user storage used
    // Note: If we reused existing storage (deduplication), we still count the file size
    // because the user is storing another reference to the file
    // However, for true deduplication accounting, you might want to track unique vs shared storage
    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });

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
}
