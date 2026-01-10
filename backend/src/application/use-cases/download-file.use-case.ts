/**
 * Download File Use Case
 * 
 * Handles file download logic with proper authorization checks.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { File, FileStatus } from '../../domain/entities/file';

export interface DownloadFileResult {
  file: Buffer;
  filename: string;
  contentType: string;
  contentLength: number;
  metadata?: Record<string, string>;
}

export class DownloadFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, fileId: string): Promise<DownloadFileResult> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify file is active
    if (!file.isActive()) {
      throw new Error('File is not available for download');
    }

    // 4. Verify file exists in storage
    const exists = await this.storageService.fileExists(file.ociObjectName);
    if (!exists) {
      // Mark file as deleted if not found in storage
      await this.fileRepository.update(fileId, {
        status: FileStatus.DELETED,
        deletedAt: new Date(),
      });
      throw new Error('File not found in storage');
    }

    // 5. Download from storage
    try {
      const storageResult = await this.storageService.downloadFile(file.ociObjectName);

      return {
        file: storageResult.file,
        filename: file.originalName,
        contentType: file.mimeType,
        contentLength: storageResult.contentLength,
        metadata: storageResult.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
