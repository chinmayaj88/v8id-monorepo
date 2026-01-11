/**
 * Bulk Move Files Use Case
 * 
 * Move multiple files to a different folder at once.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { UpdateFileUseCase } from './update-file.use-case';

export interface BulkMoveFilesDTO {
  fileIds: string[];
  folderId: string | null;
}

export class BulkMoveFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private updateFileUseCase: UpdateFileUseCase
  ) {}

  async execute(userId: string, dto: BulkMoveFilesDTO): Promise<{ moved: number; failed: number; errors: string[] }> {
    if (!dto.fileIds || dto.fileIds.length === 0) {
      throw new Error('No file IDs provided');
    }

    // Validate target folder if provided
    if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== userId || !folder.isActive()) {
        throw new Error('Target folder not found or access denied');
      }
    }

    let moved = 0;
    let failed = 0;
    const errors: string[] = [];

    // Move files one by one
    for (const fileId of dto.fileIds) {
      try {
        await this.updateFileUseCase.execute(userId, fileId, {
          folderId: dto.folderId,
        });
        moved++;
      } catch (error) {
        failed++;
        errors.push(`${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { moved, failed, errors };
  }
}
