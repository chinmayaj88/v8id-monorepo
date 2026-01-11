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

    const currentFileData = await this.storageService.downloadFile(file.ociObjectName);
    await this.createFileVersionUseCase.execute(userId, fileId, currentFileData.file, file.mimeType);

    const versionFileData = await this.storageService.downloadFile(version.ociObjectName);

    await this.storageService.uploadFile({
      objectName: file.ociObjectName,
      file: versionFileData.file,
      contentType: versionFileData.contentType,
    });

    await this.fileRepository.update(fileId, {
    });
  }
}
