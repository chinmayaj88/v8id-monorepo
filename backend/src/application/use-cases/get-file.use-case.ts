/**
 * Get File Use Case
 * 
 * Retrieves file metadata by ID.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { FileResponseDTO } from '../dtos/file.dto';

export class GetFileUseCase {
  constructor(
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, fileId: string): Promise<FileResponseDTO> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    return {
      id: file.id,
      userId: file.userId,
      folderId: file.folderId,
      name: file.name,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
      type: file.type,
      status: file.status,
      description: file.description,
      tags: file.tags,
      metadata: file.metadata,
      expiresAt: file.expiresAt?.toISOString(),
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      deletedAt: file.deletedAt?.toISOString(),
    };
  }
}
