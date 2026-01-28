import { FolderShare, ShareType, SharePermission } from '../../../../generated/prisma/index.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IFolderRepository } from '../../interfaces/files/folder-repository.interface.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateFolderShareInput {
  folderId: string;
  ownerId: string;
  type: ShareType;
  permission: SharePermission;
  email?: string; // Required for INTERNAL
  expiresInSeconds?: number; // Optional for PUBLIC_LINK
}

export class CreateFolderShareUseCase {
  constructor(
    private shareRepository: IShareRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(input: CreateFolderShareInput): Promise<FolderShare> {
    const folder = await this.folderRepository.findById(input.folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== input.ownerId) {
      throw new Error('You do not have permission to share this folder');
    }

    let sharedWith: string | undefined;
    let token: string | undefined;
    let expiresAt: Date | undefined;

    if (input.type === ShareType.INTERNAL) {
      if (!input.email) {
        throw new Error('Email is required for internal sharing');
      }
      sharedWith = input.email;
    } else if (input.type === ShareType.PUBLIC_LINK) {
      token = uuidv4(); // Generate unique token
      if (input.expiresInSeconds) {
        expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
      }
    }

    return this.shareRepository.createFolderShare({
      folderId: input.folderId,
      ownerId: input.ownerId,
      type: input.type,
      permission: input.permission,
      sharedWith,
      token,
      expiresAt,
    });
  }
}
