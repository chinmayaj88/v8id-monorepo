import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { File, Folder } from '../../../infrastructure/database/index.js';

export interface SyncDTO {
  since?: Date;
}

export interface SyncResult {
  files: any[];
  folders: any[];
  lastSync: Date;
}

export class SyncUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private shareRepository: IShareRepository
  ) {}

  async execute(userId: string, email: string, dto: SyncDTO): Promise<SyncResult> {
    const { since } = dto;
    const now = new Date();

    let files: File[] = [];
    let folders: Folder[] = [];

    // 1. Fetch Owned Items
    if (since) {
      files = await this.fileRepository.findUpdatedSince(userId, since);
      folders = await this.folderRepository.findUpdatedSince(userId, since);
    } else {
      const epoch = new Date(0);
      files = await this.fileRepository.findUpdatedSince(userId, epoch);
      folders = await this.folderRepository.findUpdatedSince(userId, epoch);
    }

    // 2. Fetch Shared Items - ONLY Incoming (Shared With Me)
    // Because simple logic: "if someone has recently shared something with me"

    const fileShares = await this.shareRepository.findFileSharesByEmail(email);
    const folderShares = await this.shareRepository.findFolderSharesByEmail(email);

    const sharedFiles: any[] = [];
    const sharedFolders: any[] = [];

    // Process File Shares
    if (fileShares) {
      fileShares.forEach((share: any) => {
        if (share.file) {
          // Check if updated OR shared recently
          if (
            !since ||
            new Date(share.file.updatedAt) > since ||
            new Date(share.createdAt) > since
          ) {
            sharedFiles.push({
              ...share.file,
              isShared: true,
              sharePermission: share.permission,
              sharedBy: share.ownerId,
              owner: share.owner
                ? {
                    firstName: share.owner.firstName,
                    lastName: share.owner.lastName,
                    email: share.owner.email,
                    avatarUrl: share.owner.avatarPath,
                  }
                : undefined,
            });
          }
        }
      });
    }

    // Process Folder Shares
    if (folderShares) {
      folderShares.forEach((share: any) => {
        if (share.folder) {
          if (
            !since ||
            new Date(share.folder.updatedAt) > since ||
            new Date(share.createdAt) > since
          ) {
            sharedFolders.push({
              ...share.folder,
              isShared: true,
              sharePermission: share.permission,
              sharedBy: share.ownerId,
              owner: share.owner
                ? {
                    firstName: share.owner.firstName,
                    lastName: share.owner.lastName,
                    email: share.owner.email,
                    avatarUrl: share.owner.avatarPath,
                  }
                : undefined,
            });
          }
        }
      });
    }

    // 3. Map Owned Files
    const mappedOwnedFiles = files.map(f => ({
      ...f,
      size: f.size.toString(),
      thumbnailUrl: f.thumbnailKey ? `api/files/${f.id}/thumbnail` : null,
      isShared: false,
    }));

    // 4. Map Shared Files
    const mappedSharedFiles = sharedFiles.map(f => ({
      ...f,
      size: f.size ? f.size.toString() : '0',
      thumbnailUrl: f.thumbnailKey ? `api/files/${f.id}/thumbnail` : null,
    }));

    return {
      files: [...mappedOwnedFiles, ...mappedSharedFiles],
      folders: [...folders, ...sharedFolders],
      lastSync: now,
    };
  }
}
