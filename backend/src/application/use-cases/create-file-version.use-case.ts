/**
 * Create File Version Use Case
 * 
 * Create a new version of a file when it's updated.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { prisma } from '../../infrastructure/database';
import { createHash } from 'crypto';

export class CreateFileVersionUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, fileId: string, newFileBuffer: Buffer, _newMimeType: string): Promise<void> {
    const currentFile = await this.fileRepository.findById(fileId);
    if (!currentFile) {
      throw new Error('File not found');
    }

    if (currentFile.userId !== userId) {
      throw new Error('Access denied');
    }

    const newHash = createHash('sha256').update(newFileBuffer).digest('hex');

    if (newHash === currentFile.hash) {
      return;
    }

    const currentVersion = await prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = currentVersion ? currentVersion.versionNumber + 1 : 1;

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const versionOciObjectName = `users/${userId}/files/versions/${fileId}/v${nextVersionNumber}-${timestamp}-${randomString}`;

    try {
      const currentFileData = await this.storageService.downloadFile(currentFile.ociObjectName);
      
      await this.storageService.uploadFile({
        objectName: versionOciObjectName,
        file: currentFileData.file,
        contentType: currentFile.mimeType,
      });
    } catch (error) {
      throw new Error(`Failed to create file version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await prisma.fileVersion.create({
      data: {
        fileId,
        versionNumber: nextVersionNumber,
        ociObjectName: versionOciObjectName,
        size: currentFile.size,
        hash: currentFile.hash,
      },
    });
  }
}
