import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { Folder, FolderShare } from '../../../infrastructure/database/index.js';

export interface SharedFolderResult {
  share: FolderShare;
  folder: Folder;
  isExpired: boolean;
}

export class GetSharedFolderUseCase {
  constructor(private shareRepository: IShareRepository) {}

  async execute(token: string): Promise<SharedFolderResult> {
    const share = await this.shareRepository.findFolderShareByToken(token);

    if (!share) {
      throw new Error('Invalid link');
    }

    const isExpired = share.expiresAt ? new Date() > share.expiresAt : false;

    if (isExpired) {
      throw new Error('Link has expired');
    }

    return {
      share,
      folder: (share as any).folder, // Repository includes folder
      isExpired,
    };
  }
}
