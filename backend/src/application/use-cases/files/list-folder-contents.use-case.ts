import { File, Folder, StorageTier } from '../../../../generated/prisma/index.js';
import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';

export interface ListFolderContentsDTO {
  parentId?: string | null; // Null for root
  limit?: number;
  offset?: number;
  tier?: StorageTier;
}

export interface ListFolderContentsResult {
  folders: Folder[];
  files: File[];
  currentFolder?: Folder | null;
  breadcrumbs: Folder[];
}

export class ListFolderContentsUseCase {
  constructor(
    private folderRepository: IFolderRepository,
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, dto: ListFolderContentsDTO): Promise<ListFolderContentsResult> {
    const parentId = dto.parentId ?? null;
    const { limit, offset, tier } = dto;

    // 1. Get current folder details... (No change)
    let currentFolder: Folder | null = null;
    let breadcrumbs: Folder[] = [];

    if (parentId) {
      currentFolder = await this.folderRepository.findById(parentId);
      if (!currentFolder) {
        throw new Error('Folder not found');
      }
      if (currentFolder.userId !== userId) {
        throw new Error('Access denied to folder');
      }

      let tempParams = currentFolder;
      while (tempParams.parentId) {
        const parent = await this.folderRepository.findById(tempParams.parentId);
        if (parent) {
          breadcrumbs.unshift(parent);
          tempParams = parent;
        } else {
          break;
        }
      }
      breadcrumbs.push(currentFolder);
    }

    // 2. Fetch Folders
    // Folders generally don't have a specific tier, so we usually listing them all.
    // If user filters by ARCHIVE, should we hide folders? Usually no, as folders might contain hybrid content.
    // However, if the requirement implies strict filtering, we might need to adjust.
    // Given the prompt "filters of the file and folders the user can filter from archive and standard",
    // it implies filtering FILES primarily. Folders are structural.
    const folders = await this.folderRepository.findAllByUserId(userId, {
      parentId,
      isDeleted: false,
      limit,
      offset,
    });

    // 3. Fetch Files (Filtered by Tier if provided)
    const files = await this.fileRepository.findAllByUserId(userId, {
      folderId: parentId,
      isDeleted: false,
      limit,
      offset,
      tier,
    });

    return {
      folders,
      files,
      currentFolder,
      breadcrumbs,
    };
  }
}
