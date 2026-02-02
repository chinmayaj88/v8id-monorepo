import { IFileRepository, IStorageService } from '../../interfaces/index.js';
import { StorageTier } from '../../../infrastructure/database/index.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';

export class GetFileThumbnailUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private shareRepository: IShareRepository,
    private userRepository: IUserRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, fileId: string) {
    const file = await this.fileRepository.findById(fileId);
    if (!file) throw new Error('File not found');

    if (!file.thumbnailKey) {
      throw new Error('No thumbnail available');
    }

    // Access Check
    if (file.userId !== userId) {
      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error('User not found');

      // 1. Check direct file share
      let hasAccess = !!(await this.shareRepository.checkFileAccess(fileId, user.email));

      // 2. Check hierarchy folder share (recursive)
      if (!hasAccess && file.folderId) {
        const folderShare = await this.shareRepository.checkFolderAccess(file.folderId, user.email);
        if (folderShare) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        throw new Error('Unauthorized access to file');
      }
    }

    // Retrieve from Object Storage (Thumbnails always in Standard Tier)
    return this.storageService.downloadFile(file.thumbnailKey, StorageTier.STANDARD);
  }
}
