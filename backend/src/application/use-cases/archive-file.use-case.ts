/**
 * Archive File Use Case
 * 
 * Archives a file (moves to archive status).
 * Archived files are kept but marked as archived for long-term storage.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { FileStatus } from '../../domain/entities/file';
import { FileResponseDTO } from '../dtos/file.dto';

export class ArchiveFileUseCase {
  constructor(
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, fileId: string): Promise<FileResponseDTO> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify file can be archived (must be active)
    if (!file.canBeArchived()) {
      throw new Error('File cannot be archived. Only active files can be archived.');
    }

    // 4. Archive file
    const archivedFile = await this.fileRepository.update(fileId, {
      status: FileStatus.ARCHIVED,
    });

    return {
      id: archivedFile.id,
      userId: archivedFile.userId,
      folderId: archivedFile.folderId,
      name: archivedFile.name,
      originalName: archivedFile.originalName,
      mimeType: archivedFile.mimeType,
      size: Number(archivedFile.size),
      type: archivedFile.type,
      status: archivedFile.status,
      description: archivedFile.description,
      tags: archivedFile.tags,
      metadata: archivedFile.metadata,
      createdAt: archivedFile.createdAt.toISOString(),
      updatedAt: archivedFile.updatedAt.toISOString(),
      deletedAt: archivedFile.deletedAt?.toISOString(),
    };
  }
}
