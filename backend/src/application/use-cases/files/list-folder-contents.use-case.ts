import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';
import { Folder, StorageTier } from '../../../infrastructure/database/index.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';
import { FileItemDTO, FolderItemDTO } from '../../dtos/files/file-item.dto.js';
import { FileMapper } from '../../utils/file.mapper.js';

export interface ListFolderContentsDTO {
  parentId?: string | null; // Null for root
  limit?: number;
  offset?: number;
  tier?: StorageTier;
}

export interface ListFolderContentsResult {
  folders: FolderItemDTO[];
  files: FileItemDTO[];
  currentFolder?: FolderItemDTO | null;
  breadcrumbs: FolderItemDTO[];
}

export class ListFolderContentsUseCase {
  constructor(
    private folderRepository: IFolderRepository,
    private fileRepository: IFileRepository,
    private shareRepository: IShareRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, dto: ListFolderContentsDTO): Promise<ListFolderContentsResult> {
    const parentId = dto.parentId ?? null;
    const { limit, offset, tier } = dto;

    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) throw new Error('User not found');
    const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

    // 1. Get current folder details and check access
    let currentFolderRaw: Folder | null = null;
    let breadcrumbsRaw: Folder[] = [];
    let isSharedFolder = false;
    let folderOwnerName = currentUserName;

    if (parentId) {
      currentFolderRaw = await this.folderRepository.findById(parentId);
      if (!currentFolderRaw) {
        throw new Error('Folder not found');
      }

      // Check ownership
      if (currentFolderRaw.userId !== userId) {
        // Access Check (handled recursively by repository)
        const share = await this.shareRepository.checkFolderAccess(parentId, currentUser.email);

        if (!share) {
          throw new Error('Access denied to folder');
        }

        isSharedFolder = true;

        const owner = await this.userRepository.findById(currentFolderRaw.userId);
        folderOwnerName = owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Unknown';
      }

      let tempParams = currentFolderRaw;
      while (tempParams.parentId) {
        const parent = await this.folderRepository.findById(tempParams.parentId);
        if (parent) {
          breadcrumbsRaw.unshift(parent);
          tempParams = parent;
        } else {
          break;
        }
      }
      breadcrumbsRaw.push(currentFolderRaw);
    }

    // 2. Fetch Folders & Files (Owned or in a specific shared folder)
    let foldersRaw: any[] = [];
    let filesRaw: any[] = [];

    // Note: Repositories now include fileShares/folderShares
    if (isSharedFolder && parentId) {
      foldersRaw = await this.folderRepository.findContentsByParentId(parentId, {
        isDeleted: false,
        limit,
        offset,
      });
      filesRaw = await this.fileRepository.findContentsByFolderId(parentId, {
        isDeleted: false,
        tier,
        limit,
        offset,
      });
    } else {
      foldersRaw = await this.folderRepository.findAllByUserId(userId, {
        parentId,
        isDeleted: false,
        limit,
        offset,
      });

      filesRaw = await this.fileRepository.findAllByUserId(userId, {
        folderId: parentId,
        isDeleted: false,
        limit,
        offset,
        tier,
      });
    }

    // 3. Map Owned/Located Items to DTOs
    const resultFolders = foldersRaw.map(f =>
      FileMapper.toFolderDTO(f, {
        isOwner: f.userId === userId,
        ownerName: f.userId === userId ? currentUserName : folderOwnerName,
      })
    );
    const resultFiles = filesRaw.map(f =>
      FileMapper.toDTO(f, {
        isOwner: f.userId === userId,
        ownerName: f.userId === userId ? currentUserName : folderOwnerName,
      })
    );

    // 4. Merge "Shared With Me" items if at Root
    if (!parentId) {
      const [sharedFiles, sharedFolders] = await Promise.all([
        this.shareRepository.findFileSharesByEmail(currentUser.email),
        this.shareRepository.findFolderSharesByEmail(currentUser.email),
      ]);

      sharedFolders.forEach((s: any) => {
        resultFolders.push(
          FileMapper.toFolderDTO(s.folder, {
            isOwner: false,
            ownerName: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
          })
        );
      });

      sharedFiles.forEach((s: any) => {
        resultFiles.push(
          FileMapper.toDTO(s.file, {
            isOwner: false,
            ownerName: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
          })
        );
      });
    }

    return {
      folders: resultFolders,
      files: resultFiles,
      currentFolder: currentFolderRaw
        ? FileMapper.toFolderDTO(currentFolderRaw, {
            isOwner: currentFolderRaw.userId === userId,
            ownerName: currentFolderRaw.userId === userId ? currentUserName : folderOwnerName,
          })
        : null,
      breadcrumbs: breadcrumbsRaw.map(f =>
        FileMapper.toFolderDTO(f, {
          isOwner: f.userId === userId,
          ownerName: f.userId === userId ? currentUserName : folderOwnerName,
        })
      ),
    };
  }
}
