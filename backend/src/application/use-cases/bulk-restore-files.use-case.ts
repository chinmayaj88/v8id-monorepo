/**
 * Bulk Restore Files Use Case
 * 
 * Restore multiple files from trash at once.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { RestoreFileUseCase } from './restore-file.use-case';

export interface BulkRestoreFilesDTO {
  fileIds: string[];
}

export class BulkRestoreFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private restoreFileUseCase: RestoreFileUseCase
  ) {}

  async execute(userId: string, dto: BulkRestoreFilesDTO): Promise<{ restored: number; failed: number; errors: string[] }> {
    if (!dto.fileIds || dto.fileIds.length === 0) {
      throw new Error('No file IDs provided');
    }

    let restored = 0;
    let failed = 0;
    const errors: string[] = [];

    // Restore files one by one
    for (const fileId of dto.fileIds) {
      try {
        await this.restoreFileUseCase.execute(userId, fileId);
        restored++;
      } catch (error) {
        failed++;
        errors.push(`${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { restored, failed, errors };
  }
}
