import { IFolderRepository } from '../../interfaces/files/folder-repository.interface.js';
import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';

export class RestoreFolderUseCase {
  constructor(
    private readonly folderRepository: IFolderRepository,
    private readonly fileRepository: IFileRepository
  ) {}

  async execute(folderId: string, userId: string): Promise<void> {
    const folder = await this.folderRepository.findById(folderId);

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (!folder.isDeleted) {
      return; // Already restored
    }

    // Recursive restore
    // 1. Get all descendants (including deleted)
    const subfolders = await this.folderRepository.findDescendants(folderId, userId, true);
    const allFolderIds = [folderId, ...subfolders.map(f => f.id)];

    // 2. Get all files (including deleted)
    const files = await this.fileRepository.findDescendants(allFolderIds, userId, true);

    // 3. Restore files
    for (const file of files) {
      if (file.isDeleted) {
        await this.fileRepository.restore(file.id);
      }
    }

    // 4. Restore subfolders
    for (const f of subfolders) {
      if (f.isDeleted) {
        await this.folderRepository.restore(f.id);
      }
    }

    // 5. Restore target folder
    await this.folderRepository.restore(folderId);
  }
}
