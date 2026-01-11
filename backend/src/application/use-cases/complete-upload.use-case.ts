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
import { File, FileStatus, FileType } from '../../domain/entities/file';
import { FileResponseDTO } from '../dtos/file.dto';
import { createHash } from 'crypto';

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
    private storageService: IStorageService
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

    if (session.isDirectUpload() && session.ociObjectName) {
      const exists = await this.storageService.fileExists(session.ociObjectName);
      if (!exists) {
        throw new Error('File not found in storage. Upload may have failed.');
      }
    } else if (session.isBackendUpload()) {
      if (session.ociObjectName) {
        const exists = await this.storageService.fileExists(session.ociObjectName);
        if (!exists) {
          throw new Error('File not found in storage. Backend chunked upload may have failed.');
        }
      }
    }

    let fileHash: string;
    if (session.ociObjectName) {
      try {
        const fileData = await this.storageService.downloadFile(session.ociObjectName);
        fileHash = createHash('sha256').update(fileData.file).digest('hex');
      } catch (error) {
        throw new Error(`Failed to calculate file hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      throw new Error('OCI object name not set in upload session');
    }

    const existingFile = await this.fileRepository.findByHash(fileHash, userId);
    if (existingFile && existingFile.isActive()) {
      try {
        await this.storageService.deleteFile(session.ociObjectName!);
      } catch (error) {
        console.warn('Failed to delete duplicate file from storage:', error);
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
        ociObjectName: session.ociObjectName!,
        hash: fileHash,
        description: dto.description,
        tags: dto.tags,
        metadata: dto.metadata,
      });
    } catch (error) {
      try {
        await this.storageService.deleteFile(session.ociObjectName!);
      } catch (deleteError) {
        console.error('Failed to delete file from storage after database error:', deleteError);
      }
      throw new Error(`Failed to create file record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.uploadSessionRepository.update(session.id, {
      isCompleted: true,
      hash: fileHash,
    });

    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });

    if (session.parId) {
      try {
        await this.storageService.deletePreAuthenticatedRequest(session.parId);
      } catch (error) {
        console.warn('Failed to delete PAR:', error);
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
      description: file.description,
      tags: file.tags,
      metadata: file.metadata,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      deletedAt: file.deletedAt?.toISOString(),
    };
  }
}
