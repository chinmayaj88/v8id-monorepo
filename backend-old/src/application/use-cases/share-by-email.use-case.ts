/**
 * Share by Email Use Case
 *
 * Share a file or folder with another user by email address.
 */

import { IFileShareRepository } from '../interfaces/file-share-repository.interface.js';
import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { FileShare, SharePermission } from '../../domain/entities/file-share.js';

export interface ShareByEmailDTO {
  fileId?: string | null;
  folderId?: string | null;
  email: string;
  permission: 'VIEW' | 'EDIT';
}

export class ShareByEmailUseCase {
  constructor(
    private fileShareRepository: IFileShareRepository,
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(ownerId: string, dto: ShareByEmailDTO): Promise<FileShare> {
    // Validate that either fileId or folderId is provided, but not both
    if ((!dto.fileId && !dto.folderId) || (dto.fileId && dto.folderId)) {
      throw new Error('Either fileId or folderId must be provided, but not both');
    }

    // Find user by email
    const sharedWithUser = await this.userRepository.findByEmail(dto.email);
    if (!sharedWithUser) {
      throw new Error(`User with email ${dto.email} not found`);
    }

    if (!sharedWithUser.isUserActive()) {
      throw new Error('User is inactive');
    }

    // Prevent sharing with yourself
    if (ownerId === sharedWithUser.id) {
      throw new Error('Cannot share with yourself');
    }

    // Map simplified permissions to existing schema
    const permissionMap: Record<string, SharePermission> = {
      VIEW: SharePermission.READ,
      EDIT: SharePermission.WRITE,
    };
    const permission = permissionMap[dto.permission] || SharePermission.READ;

    // Verify ownership and status of file/folder
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

    // Check for existing share
    const existingShare = await this.fileShareRepository.findShare(
      dto.fileId || null,
      dto.folderId || null,
      sharedWithUser.id
    );

    if (existingShare) {
      // Update existing share permission
      return await this.fileShareRepository.update(existingShare.id, {
        permission,
      });
    }

    // Create new share
    return await this.fileShareRepository.create({
      fileId: dto.fileId || null,
      folderId: dto.folderId || null,
      ownerId,
      sharedWithId: sharedWithUser.id,
      permission,
    });
  }
}
