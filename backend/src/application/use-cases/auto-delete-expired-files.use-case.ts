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
    const now = new Date();
    let deleted = 0;
    const errors: string[] = [];

    // 1. Find all files with expiration date in the past
    // Note: This requires a new repository method to find expired files
    // For now, we'll get all active files and filter
    const allFilesResult = await this.fileRepository.findByUserId('', {
      status: undefined, // Get all files
    });

    const expiredFiles = allFilesResult.files.filter(file => {
      return file.expiresAt && file.expiresAt <= now && file.isActive();
    });

    // 2. Delete each expired file
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
