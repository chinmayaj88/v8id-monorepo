import { File, Folder } from '../../../../generated/prisma/index.js';
import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';

export interface ListFolderContentsDTO {
  parentId?: string | null; // Null for root
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

    // 1. Get current folder details and breadcrumbs if not root
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

      // Build breadcrumbs recursively (simple approach: fetch hierarchy)
      // Since we store 'path', we can potentially optimize this, but for now simple recursive parent lookup is fine or robust path parsing.
      // Or we can rely on a method in repository if implemented.
      // For MVP, if path is available, we could split it, but we need IDs.

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
      // Add current folder to end (or keep it separate, depends on UI)
      // Usually breadcrumbs exclude current or include it. Let's include everything leading UP to it.
      // Wait, typical breadcrumb: Root > Parent > Current.
      breadcrumbs.push(currentFolder);
    }

    // 2. Fetch Folders
    const folders = await this.folderRepository.findByParentId(parentId, userId);

    // 3. Fetch Files
    const files = await this.fileRepository.findByFolderId(parentId, userId);

    return {
      folders,
      files,
      currentFolder,
      breadcrumbs,
    };
  }
}
