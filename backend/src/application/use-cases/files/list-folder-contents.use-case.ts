import { File, Folder, StorageTier } from '../../../../generated/prisma/index.js';
import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';
import {
  FileItemDTO,
  FolderItemDTO,
  FolderWithBreadcrumbsDTO,
} from '../../dtos/files/file-item.dto.js';

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
    const mapFolder = (f: any): FolderItemDTO => ({
      id: f.id,
      name: f.name,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      isOwner: f.userId === userId,
      ownerName: f.userId === userId ? currentUserName : folderOwnerName,
      // Map shares (recipients)
      sharedUsers: f.folderShares
        ? f.folderShares.map((s: any) => ({
            name: s.sharedWith, // Email
            avatarUrl: null,
          }))
        : [],
    });

    const mapFile = (f: any): FileItemDTO => ({
      id: f.id,
      name: f.name,
      size: f.size.toString(),
      mimeType: f.mimeType,
      extension: f.extension,
      thumbnailUrl: null,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      isOwner: f.userId === userId,
      ownerName: f.userId === userId ? currentUserName : folderOwnerName,
      tier: f.storageTier,
      // Map shares (recipients)
      sharedUsers: f.fileShares
        ? f.fileShares.map((s: any) => ({
            name: s.sharedWith, // Email
            avatarUrl: null,
          }))
        : [],
    });

    const resultFolders = foldersRaw.map(mapFolder);
    const resultFiles = filesRaw.map(mapFile);

    // 4. Merge "Shared With Me" items if at Root
    // These are items where I am the recipient
    if (!parentId) {
      const [sharedFiles, sharedFolders] = await Promise.all([
        this.shareRepository.findFileSharesByEmail(currentUser.email),
        this.shareRepository.findFolderSharesByEmail(currentUser.email),
      ]);

      sharedFolders.forEach((s: any) => {
        resultFolders.push({
          id: s.folder.id,
          name: s.folder.name,
          createdAt: s.folder.createdAt,
          updatedAt: s.folder.updatedAt,
          isOwner: false,
          ownerName: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
          sharedUsers: [
            {
              name: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
              avatarUrl: s.owner.avatarPath,
            },
          ],
        });
      });

      sharedFiles.forEach((s: any) => {
        resultFiles.push({
          id: s.file.id,
          name: s.file.name,
          size: s.file.size.toString(),
          mimeType: s.file.mimeType,
          extension: s.file.extension,
          thumbnailUrl: null,
          createdAt: s.file.createdAt,
          updatedAt: s.file.updatedAt,
          isOwner: false,
          ownerName: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
          tier: s.file.storageTier,
          sharedUsers: [
            {
              name: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
              avatarUrl: s.owner.avatarPath,
            },
          ],
        });
      });
    }

    return {
      folders: resultFolders,
      files: resultFiles,
      currentFolder: currentFolderRaw ? mapFolder(currentFolderRaw) : null,
      breadcrumbs: breadcrumbsRaw.map(mapFolder),
    };
  }
}
