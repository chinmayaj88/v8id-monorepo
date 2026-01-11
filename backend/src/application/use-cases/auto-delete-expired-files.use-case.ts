/**
 * Auto Delete Expired Files Use Case
 * 
 * Automatically delete files that have passed their expiration date.
 * This should be run as a scheduled job.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { DeleteFileUseCase } from './delete-file.use-case';

export interface AutoDeleteResult {
  deleted: number;
  errors: string[];
}

export class AutoDeleteExpiredFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private userRepository: IUserRepository,
    private deleteFileUseCase: DeleteFileUseCase
  ) {}

  async execute(): Promise<AutoDeleteResult> {
    let deleted = 0;
    const errors: string[] = [];

    // Use optimized query that filters expired files at database level
    // This is much more efficient than fetching all files and filtering in memory
    const expiredFiles = await this.fileRepository.findExpiredFiles();

    for (const file of expiredFiles) {
      try {
        await this.deleteFileUseCase.execute(file.userId, file.id);
        deleted++;
      } catch (error) {
        errors.push(`${file.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { deleted, errors };
  }
}
