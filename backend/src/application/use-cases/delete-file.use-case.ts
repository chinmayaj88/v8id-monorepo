/**
 * Delete File Use Case
 * 
 * Handles file deletion (soft delete) - moves file to trash.
 * Files are always soft deleted and can be restored from trash.
 * Use PermanentDeleteFileUseCase to permanently delete from trash.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { FileStatus } from '../../domain/entities/file';

export class DeleteFileUseCase {
  constructor(
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, fileId: string): Promise<void> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify file can be deleted (not already deleted)
    if (!file.canBeDeleted()) {
      throw new Error('File cannot be deleted. File is already in trash. Use permanent delete to remove it completely.');
    }

    // 4. Soft delete: mark as deleted but keep in storage (move to trash)
    await this.fileRepository.update(fileId, {
      status: FileStatus.DELETED,
      deletedAt: new Date(),
    });

    // Note: Storage is not freed on soft delete - file remains in storage
    // Storage will be freed only when permanently deleted from trash
  }
}
