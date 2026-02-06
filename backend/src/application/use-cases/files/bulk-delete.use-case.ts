import { DeleteFileUseCase } from './delete-file.use-case.js';
import { DeleteFolderUseCase } from './delete-folder.use-case.js';

export interface BulkDeleteRequest {
  fileIds: string[];
  folderIds: string[];
  permanent?: boolean;
}

export class BulkDeleteUseCase {
  constructor(
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly deleteFolderUseCase: DeleteFolderUseCase
  ) {}

  async execute(userId: string, request: BulkDeleteRequest): Promise<void> {
    const { fileIds, folderIds, permanent = false } = request;

    for (const fileId of fileIds) {
      try {
        await this.deleteFileUseCase.execute(fileId, userId, permanent);
      } catch (error) {
        console.error(`Failed to delete file ${fileId}:`, error);
      }
    }

    for (const folderId of folderIds) {
      try {
        await this.deleteFolderUseCase.execute(folderId, userId, permanent);
      } catch (error) {
        console.error(`Failed to delete folder ${folderId}:`, error);
      }
    }
  }
}
