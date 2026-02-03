/**
 * Delete File Use Case
 * 
 * Handles file deletion (soft delete) - moves file to trash.
 * Files are always soft deleted and can be restored from trash.
 * Use PermanentDeleteFileUseCase to permanently delete from trash.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { FileStatus } from '../../domain/entities/file.js';

export class DeleteFileUseCase {
  constructor(
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, fileId: string): Promise<void> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!file.canBeDeleted()) {
      throw new Error('File cannot be deleted. File is already in trash. Use permanent delete to remove it completely.');
    }

    await this.fileRepository.update(fileId, {
      status: FileStatus.DELETED,
      deletedAt: new Date(),
    });
  }
}
