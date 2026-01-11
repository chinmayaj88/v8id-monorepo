/**
 * Copy File Use Case
 * 
 * Copy a file to another folder or duplicate in the same folder.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { FileResponseDTO } from '../dtos/file.dto';

export interface CopyFileDTO {
  targetFolderId?: string | null;
  newName?: string;
}

export class CopyFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, fileId: string, dto: CopyFileDTO): Promise<FileResponseDTO> {
    // 1. Find source file
    const sourceFile = await this.fileRepository.findById(fileId);
    if (!sourceFile) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (sourceFile.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify file is active
    if (!sourceFile.isActive()) {
      throw new Error('Cannot copy deleted or archived files');
    }

    // 4. Validate target folder if provided
    const targetFolderId = dto.targetFolderId !== undefined ? dto.targetFolderId : sourceFile.folderId;
    if (targetFolderId) {
      const folder = await this.folderRepository.findById(targetFolderId);
      if (!folder || folder.userId !== userId || !folder.isActive()) {
        throw new Error('Target folder not found or access denied');
      }
    }

    // 5. Check storage quota
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isUserActive()) {
      throw new Error('User not found or inactive');
    }

    const availableStorage = user.getAvailableStorage();
    if (sourceFile.size > availableStorage) {
      throw new Error('Insufficient storage to copy file');
    }

    // 6. Determine new name
    let newName = dto.newName || sourceFile.name;
    const nameExists = await this.fileRepository.nameExistsInFolder(userId, targetFolderId, newName);
    if (nameExists) {
      const ext = this.getFileExtension(sourceFile.name);
      const baseName = ext ? newName.replace(new RegExp(`\\.${ext}$`, 'i'), '') : newName;
      const timestamp = Date.now();
      newName = ext ? `${baseName}-copy-${timestamp}.${ext}` : `${baseName}-copy-${timestamp}`;
    }

    // 7. Copy file in storage
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const newOciObjectName = `users/${userId}/files/${timestamp}-${randomString}-${newName}`;

    try {
      await this.storageService.copyFile(sourceFile.ociObjectName, newOciObjectName);
    } catch (error) {
      throw new Error(`Failed to copy file in storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 8. Create new file record
    const newFile = await this.fileRepository.create({
      userId,
      folderId: targetFolderId,
      name: newName,
      originalName: sourceFile.originalName,
      mimeType: sourceFile.mimeType,
      size: sourceFile.size,
      type: sourceFile.type,
      status: sourceFile.status,
      ociObjectName: newOciObjectName,
      hash: sourceFile.hash, // Same hash (same content)
      description: sourceFile.description,
      tags: sourceFile.tags,
      metadata: sourceFile.metadata,
    });

    // 9. Update user storage
    const currentStorageUsed = await this.fileRepository.getStorageUsedByUser(userId);
    await this.userRepository.update(userId, {
      storageUsed: currentStorageUsed,
    });

    return {
      id: newFile.id,
      userId: newFile.userId,
      folderId: newFile.folderId,
      name: newFile.name,
      originalName: newFile.originalName,
      mimeType: newFile.mimeType,
      size: Number(newFile.size),
      type: newFile.type,
      status: newFile.status,
      description: newFile.description,
      tags: newFile.tags,
      metadata: newFile.metadata,
      createdAt: newFile.createdAt.toISOString(),
      updatedAt: newFile.updatedAt.toISOString(),
      deletedAt: newFile.deletedAt?.toISOString(),
    };
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      const extension = parts[parts.length - 1];
      return extension || '';
    }
    return '';
  }
}
