/**
 * Unshare File Use Case
 * 
 * Remove a share of a file or folder.
 */

import { IFileShareRepository } from '../interfaces/file-share-repository.interface';

export class UnshareFileUseCase {
  constructor(
    private fileShareRepository: IFileShareRepository
  ) {}

  async execute(ownerId: string, shareId: string): Promise<void> {
    // 1. Find share
    const share = await this.fileShareRepository.findById(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    // 2. Verify ownership
    if (share.ownerId !== ownerId) {
      throw new Error('Access denied. Only the owner can unshare.');
    }

    // 3. Delete share
    await this.fileShareRepository.delete(shareId);
  }
}
