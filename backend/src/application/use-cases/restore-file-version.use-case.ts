/**
 * Restore File Version Use Case
 * 
 * Restore a previous version of a file.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { CreateFileVersionUseCase } from './create-file-version.use-case';
import { prisma } from '../../infrastructure/database';

export class RestoreFileVersionUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private createFileVersionUseCase: CreateFileVersionUseCase
  ) {}

  async execute(userId: string, fileId: string, versionId: string): Promise<void> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Find version
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.fileId !== fileId) {
      throw new Error('Version not found');
    }

    // 4. Create version of current file before restoring
    const currentFileData = await this.storageService.downloadFile(file.ociObjectName);
    await this.createFileVersionUseCase.execute(userId, fileId, currentFileData.file, file.mimeType);

    // 5. Download version file
    const versionFileData = await this.storageService.downloadFile(version.ociObjectName);

    // 6. Upload version file to replace current file
    await this.storageService.uploadFile({
      objectName: file.ociObjectName,
      file: versionFileData.file,
      contentType: versionFileData.contentType,
    });

    // 7. Update file record with version info
    await this.fileRepository.update(fileId, {
      // File metadata remains the same, only content is restored
    });
  }
}
