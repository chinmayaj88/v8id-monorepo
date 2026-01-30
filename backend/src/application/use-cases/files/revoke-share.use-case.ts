import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';

export class RevokeShareUseCase {
  constructor(private shareRepository: IShareRepository) {}

  async execute(userId: string, shareId: string): Promise<void> {
    // 1. Try finding as File Share
    const fileShare = await this.shareRepository.findFileShareById(shareId);
    if (fileShare) {
      if (fileShare.ownerId !== userId) {
        throw new Error('Unauthorized to revoke this share');
      }
      await this.shareRepository.deleteFileShare(shareId);
      return;
    }

    // 2. Try finding as Folder Share
    const folderShare = await this.shareRepository.findFolderShareById(shareId);
    if (folderShare) {
      if (folderShare.ownerId !== userId) {
        throw new Error('Unauthorized to revoke this share');
      }
      await this.shareRepository.deleteFolderShare(shareId);
      return;
    }

    throw new Error('Share not found');
  }
}
