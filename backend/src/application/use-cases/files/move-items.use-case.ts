import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { IFolderRepository } from '../../interfaces/files/folder-repository.interface.js';

export interface MoveItemsRequest {
  fileIds: string[];
  folderIds: string[];
  targetFolderId: string | null;
}

export class MoveItemsUseCase {
  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, request: MoveItemsRequest): Promise<void> {
    const { fileIds, folderIds, targetFolderId } = request;

    // 1. Validate Target Folder
    let targetPath = '';
    if (targetFolderId) {
      const targetFolder = await this.folderRepository.findById(targetFolderId);
      if (!targetFolder) throw new Error('Target folder not found');
      if (targetFolder.userId !== userId) throw new Error('Unauthorized');
      targetPath = targetFolder.path;
    }

    // 2. Move Files
    for (const fileId of fileIds) {
      const file = await this.fileRepository.findById(fileId);
      if (file && file.userId === userId) {
        await this.fileRepository.update(fileId, { folderId: targetFolderId });
      }
    }

    // 3. Move Folders
    for (const folderId of folderIds) {
      if (folderId === targetFolderId) continue; // Cannot move into itself

      const folder = await this.folderRepository.findById(folderId);
      if (folder && folder.userId === userId) {
        // Prevent moving into a descendant (Infinite recursion check)
        if (targetPath.startsWith(folder.path + '/')) {
          throw new Error('Cannot move a folder into its own subfolder');
        }

        const oldPath = folder.path;
        const newPath = targetFolderId ? `${targetPath}/${folder.name}` : folder.name; // In root it's just name

        // Update Folder parent and path
        await this.folderRepository.update(folderId, {
          parentId: targetFolderId,
          path: newPath,
        });

        // RECURSIVELY UPDATE DESCENDANTS' PATHS
        const descendants = await this.folderRepository.findDescendants(folderId, userId);
        for (const desc of descendants) {
          const relativePath = desc.path.substring(oldPath.length);
          const updatedDescPath = newPath + relativePath;
          await this.folderRepository.update(desc.id, { path: updatedDescPath });
        }
      }
    }
  }
}
