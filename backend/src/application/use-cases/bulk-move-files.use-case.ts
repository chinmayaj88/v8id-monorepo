/**
 * Bulk Move Files Use Case
 * 
 * Move multiple files to a different folder at once.
 * OPTIMIZED: Uses batch database operations instead of loops.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';

export interface BulkMoveFilesDTO {
  fileIds: string[];
  folderId: string | null;
}

export class BulkMoveFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, dto: BulkMoveFilesDTO): Promise<{ moved: number; failed: number; errors: string[] }> {
    if (!dto.fileIds || dto.fileIds.length === 0) {
      throw new Error('No file IDs provided');
    }

    // Validate target folder if provided (single query)
    if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== userId || !folder.isActive()) {
        throw new Error('Target folder not found or access denied');
      }
    }

    // Validate all files belong to user (batch query)
    const files = await Promise.all(
      dto.fileIds.map(id => this.fileRepository.findById(id))
    );

    const validFileIds: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = dto.fileIds[i];

      if (!file) {
        errors.push(`${fileId}: File not found`);
        continue;
      }

      if (file.userId !== userId) {
        errors.push(`${fileId}: Access denied`);
        continue;
      }

      if (!file.isActive()) {
        errors.push(`${fileId}: File is not active`);
        continue;
      }

      validFileIds.push(fileId);
    }

    // Batch update all valid files in one query (much more efficient!)
    let moved = 0;
    if (validFileIds.length > 0) {
      moved = await this.fileRepository.batchUpdateFolder(userId, validFileIds, dto.folderId);
    }

    return {
      moved,
      failed: errors.length,
      errors,
    };
  }
}
