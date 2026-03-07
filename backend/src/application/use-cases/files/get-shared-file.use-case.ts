import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { FileShare, File } from '../../../infrastructure/database/index.js';
import { FileMapper } from '../../utils/file.mapper.js';
import { FileItemDTO } from '../../dtos/files/file-item.dto.js';

export interface SharedFileResult {
  share: FileShare;
  file: FileItemDTO;
  isExpired: boolean;
}

export class GetSharedFileUseCase {
  constructor(private shareRepository: IShareRepository) {}

  async execute(token: string): Promise<SharedFileResult> {
    const share = await this.shareRepository.findFileShareByToken(token);

    if (!share) {
      throw new Error('Invalid link');
    }

    const isExpired = share.expiresAt ? new Date() > share.expiresAt : false;

    if (isExpired) {
      throw new Error('Link has expired');
    }

    if (!share.fileId) {
      // Should be loaded by repository include
      throw new Error('File information missing');
    }

    return {
      share,
      file: FileMapper.toDTO((share as any).file),
      isExpired,
    };
  }
}
