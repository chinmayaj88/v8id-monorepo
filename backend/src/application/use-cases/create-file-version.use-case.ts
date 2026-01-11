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
    // 1. Find current file
    const currentFile = await this.fileRepository.findById(fileId);
    if (!currentFile) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (currentFile.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Calculate hash of new file
    const newHash = createHash('sha256').update(newFileBuffer).digest('hex');

    // 4. Check if content is the same (no need to version if identical)
    if (newHash === currentFile.hash) {
      return; // No change, skip versioning
    }

    // 5. Get current version number
    const currentVersion = await prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = currentVersion ? currentVersion.versionNumber + 1 : 1;

    // 6. Save current file as version in storage
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const versionOciObjectName = `users/${userId}/files/versions/${fileId}/v${nextVersionNumber}-${timestamp}-${randomString}`;

    try {
      // Download current file
      const currentFileData = await this.storageService.downloadFile(currentFile.ociObjectName);
      
      // Upload as version
      await this.storageService.uploadFile({
        objectName: versionOciObjectName,
        file: currentFileData.file,
        contentType: currentFile.mimeType,
      });
    } catch (error) {
      throw new Error(`Failed to create file version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 7. Create version record
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
