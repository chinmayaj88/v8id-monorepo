import { DeleteFileUseCase } from './delete-file.use-case.js';
import { DeleteFolderUseCase } from './delete-folder.use-case.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';

export interface BulkDeleteRequest {
  fileIds: string[];
  folderIds: string[];
  permanent?: boolean;
}

export class BulkDeleteUseCase {
  constructor(
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly deleteFolderUseCase: DeleteFolderUseCase,
    private readonly shareRepository: IShareRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(userId: string, request: BulkDeleteRequest): Promise<void> {
    const { fileIds, folderIds, permanent = false } = request;

    // Get user email for share checking
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    for (const fileId of fileIds) {
      try {
        await this.deleteFileUseCase.execute(fileId, userId, permanent);
      } catch (error: any) {
        // If unauthorized, check if it's a shared file and remove the share instead
        if (error.message === 'Unauthorized') {
          const share = await this.shareRepository.checkFileAccess(fileId, user.email);
          if (share) {
            await this.shareRepository.deleteFileShare(share.id);
            continue;
          }
        }
        // Silently skip or handle in controller
      }
    }

    for (const folderId of folderIds) {
      try {
        await this.deleteFolderUseCase.execute(folderId, userId, permanent);
      } catch (error: any) {
        // Same logic for folders
        if (error.message === 'Unauthorized') {
          const share = await this.shareRepository.checkFolderAccess(folderId, user.email);
          if (share) {
            await this.shareRepository.deleteFolderShare(share.id);
            continue;
          }
        }
        // Silently skip or handle in controller
      }
    }
  }
}
