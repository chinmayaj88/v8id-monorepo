import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { File, Folder } from '../../../infrastructure/database/index.js';
import { FileMapper } from '../../utils/file.mapper.js';
import { FileItemDTO, FolderItemDTO } from '../../dtos/files/file-item.dto.js';

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
    const fileShares = await this.shareRepository.findFileSharesByEmail(email);
    const folderShares = await this.shareRepository.findFolderSharesByEmail(email);

    const sharedFiles: any[] = [];
    const sharedFolders: any[] = [];

    // Process File Shares
    if (fileShares) {
      fileShares.forEach((share: any) => {
        if (share.file) {
          if (
            !since ||
            new Date(share.file.updatedAt) > since ||
            new Date(share.createdAt) > since
          ) {
            sharedFiles.push({
              file: share.file,
              owner: share.owner,
              permission: share.permission,
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

    // 3. Map Owned Items
    const mappedOwnedFiles = files.map(f =>
      FileMapper.toDTO(f, { isOwner: true, ownerName: 'Me' })
    );
    const mappedOwnedFolders = folders.map(f =>
      FileMapper.toFolderDTO(f, { isOwner: true, ownerName: 'Me' })
    );

    // 4. Map Shared Items
    const mappedSharedFiles = sharedFiles.map(s =>
      FileMapper.toDTO(s.file, {
        isOwner: false,
        ownerName: s.owner ? `${s.owner.firstName} ${s.owner.lastName}`.trim() : 'Unknown',
      })
    );

    const mappedSharedFolders = sharedFolders.map(f =>
      FileMapper.toFolderDTO(f, {
        isOwner: false,
        ownerName: f.owner ? `${f.owner.firstName} ${f.owner.lastName}`.trim() : 'Unknown',
      })
    );

    return {
      files: [...mappedOwnedFiles, ...mappedSharedFiles],
      folders: [...mappedOwnedFolders, ...mappedSharedFolders],
      lastSync: now,
    };
  }
}
