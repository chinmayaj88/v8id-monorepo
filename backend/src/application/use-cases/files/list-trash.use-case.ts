import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { IFolderRepository } from '../../interfaces/files/folder-repository.interface.js';

export class ListTrashUseCase {
  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly folderRepository: IFolderRepository
  ) {}

  async execute(
    userId: string,
    _options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    // For now, we will just fetch both and concat, or fetch separately.
    // Since pagination across two tables is hard without a view or union,
    // we will just fetch deleted items.
    // If we want a true paginated mixed list, we'd need to fetch limit/2 from each or something complex.
    // Let's just fetch all deleted for now (or ample limit) and sort in memory if needed,
    // OR just return them as separate lists { files: [], folders: [] } which is common for "Trash" views.

    // As per user request "see the files and folders in the trash". Separate lists is easiest and valid.

    const folders = await this.folderRepository.findAllByUserId(userId, {
      isDeleted: true,
      // limit: options.limit, // Applying limit to both independently
      // offset: options.offset
    });

    const files = await this.fileRepository.findAllByUserId(userId, {
      isDeleted: true,
      // limit: options.limit,
      // offset: options.offset
    });

    return {
      folders,
      files,
    };
  }
}
