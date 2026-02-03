/**
 * Share File Use Case
 * 
 * Share a file or folder with another user.
 */

import { IFileShareRepository } from '../interfaces/file-share-repository.interface.js';
import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { FileShare, SharePermission } from '../../domain/entities/file-share.js';

export interface ShareFileDTO {
  fileId?: string | null;
  folderId?: string | null;
  sharedWithId: string;
  permission: 'READ' | 'WRITE' | 'VIEW_ONLY';
}

export class ShareFileUseCase {
  constructor(
    private fileShareRepository: IFileShareRepository,
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(ownerId: string, dto: ShareFileDTO): Promise<FileShare> {
    if ((!dto.fileId && !dto.folderId) || (dto.fileId && dto.folderId)) {
      throw new Error('Either fileId or folderId must be provided, but not both');
    }

    const sharedWithUser = await this.userRepository.findById(dto.sharedWithId);
    if (!sharedWithUser || !sharedWithUser.isUserActive()) {
      throw new Error('User not found or inactive');
    }

    if (ownerId === dto.sharedWithId) {
      throw new Error('Cannot share with yourself');
    }

    if (dto.fileId) {
      const file = await this.fileRepository.findById(dto.fileId);
      if (!file || file.userId !== ownerId) {
        throw new Error('File not found or access denied');
      }
      if (!file.isActive()) {
        throw new Error('Cannot share deleted or archived files');
      }
    } else if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== ownerId) {
        throw new Error('Folder not found or access denied');
      }
      if (folder.isDeleted) {
        throw new Error('Cannot share deleted folders');
      }
    }

    const existingShare = await this.fileShareRepository.findShare(
      dto.fileId || null,
      dto.folderId || null,
      dto.sharedWithId
    );

    if (existingShare) {
      return await this.fileShareRepository.update(existingShare.id, {
        permission: dto.permission as SharePermission,
      });
    }

    return await this.fileShareRepository.create({
      fileId: dto.fileId || null,
      folderId: dto.folderId || null,
      ownerId,
      sharedWithId: dto.sharedWithId,
      permission: dto.permission as SharePermission,
    });
  }
}
