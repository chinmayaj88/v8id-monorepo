/**
 * Restore File Version Use Case
 * 
 * Restore a previous version of a file.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service';
import { CreateFileVersionUseCase } from './create-file-version.use-case';
import { prisma } from '../../infrastructure/database';

export class RestoreFileVersionUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private createFileVersionUseCase: CreateFileVersionUseCase
  ) {}

  async execute(userId: string, fileId: string, versionId: string): Promise<void> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.fileId !== fileId) {
      throw new Error('Version not found');
    }

    // Use tier-aware storage service - versions are in same tier as file
    const isTierAware = this.storageService instanceof TierAwareStorageService;
    const storageTier = file.storageTier || 'STANDARD' as any;

    // Download current file from tier-specific bucket
    const currentFileData = isTierAware
      ? await (this.storageService as TierAwareStorageService).downloadFile(file.ociObjectName, storageTier)
      : await this.storageService.downloadFile(file.ociObjectName);
    
    await this.createFileVersionUseCase.execute(userId, fileId, currentFileData.file, file.mimeType);

    // Download version file (versions are stored in same tier as original file)
    const versionFileData = isTierAware
      ? await (this.storageService as TierAwareStorageService).downloadFile(version.ociObjectName, storageTier)
      : await this.storageService.downloadFile(version.ociObjectName);

    // Upload restored version to same tier bucket
    await this.storageService.uploadFile({
      objectName: file.ociObjectName,
      file: versionFileData.file,
      contentType: versionFileData.contentType,
      tier: isTierAware ? storageTier : undefined,
    });

    await this.fileRepository.update(fileId, {
    });
  }
}
