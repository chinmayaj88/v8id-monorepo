/**
 * Download File Use Case
 * 
 * Handles file download logic with proper authorization checks.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { FileStatus } from '../../domain/entities/file';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service';

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
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!file.isActive()) {
      throw new Error('File is not available for download');
    }

    // Use tier-aware storage service if available, otherwise fallback to standard
    const isTierAware = this.storageService instanceof TierAwareStorageService;
    const storageTier = file.storageTier || 'STANDARD' as any;

    // Check file existence in tier-specific bucket
    const exists = isTierAware
      ? await (this.storageService as TierAwareStorageService).fileExists(file.ociObjectName, storageTier)
      : await this.storageService.fileExists(file.ociObjectName);

    if (!exists) {
      await this.fileRepository.update(fileId, {
        status: FileStatus.DELETED,
        deletedAt: new Date(),
      });
      throw new Error('File not found in storage');
    }

    try {
      // Download from tier-specific bucket
      const storageResult = isTierAware
        ? await (this.storageService as TierAwareStorageService).downloadFile(file.ociObjectName, storageTier)
        : await this.storageService.downloadFile(file.ociObjectName);

      return {
        file: storageResult.file,
        filename: file.originalName,
        contentType: file.mimeType,
        contentLength: storageResult.contentLength,
        metadata: storageResult.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to download file from ${storageTier} tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
