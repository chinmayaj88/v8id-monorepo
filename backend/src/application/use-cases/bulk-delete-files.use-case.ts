/**
 * Bulk Delete Files Use Case
 * 
 * Delete multiple files at once (soft delete - move to trash).
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { DeleteFileUseCase } from './delete-file.use-case';

export interface BulkDeleteFilesDTO {
  fileIds: string[];
}

export class BulkDeleteFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private deleteFileUseCase: DeleteFileUseCase
  ) {}

  async execute(userId: string, dto: BulkDeleteFilesDTO): Promise<{ deleted: number; failed: number; errors: string[] }> {
    if (!dto.fileIds || dto.fileIds.length === 0) {
      throw new Error('No file IDs provided');
    }

    let deleted = 0;
    let failed = 0;
    const errors: string[] = [];

    // Delete files one by one (can be optimized with batch operations)
    for (const fileId of dto.fileIds) {
      try {
        await this.deleteFileUseCase.execute(userId, fileId);
        deleted++;
      } catch (error) {
        failed++;
        errors.push(`${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { deleted, failed, errors };
  }
}
