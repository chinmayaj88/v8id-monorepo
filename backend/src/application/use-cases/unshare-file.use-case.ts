/**
 * Unshare File Use Case
 * 
 * Remove a share of a file or folder.
 */

import { IFileShareRepository } from '../interfaces/file-share-repository.interface.js';

export class UnshareFileUseCase {
  constructor(
    private fileShareRepository: IFileShareRepository
  ) {}

  async execute(ownerId: string, shareId: string): Promise<void> {
    const share = await this.fileShareRepository.findById(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    if (share.ownerId !== ownerId) {
      throw new Error('Access denied. Only the owner can unshare.');
    }

    await this.fileShareRepository.delete(shareId);
  }
}
