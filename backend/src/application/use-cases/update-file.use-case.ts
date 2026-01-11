/**
 * Update File Use Case
 * 
 * Handles file metadata updates (name, description, tags, folder).
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { UpdateFileDTO, FileResponseDTO } from '../dtos/file.dto';
import { File } from '../../domain/entities/file';

export class UpdateFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, fileId: string, dto: UpdateFileDTO): Promise<FileResponseDTO> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!file.isActive()) {
      throw new Error('Cannot update deleted file');
    }

    if (dto.folderId !== undefined && dto.folderId !== file.folderId) {
      if (dto.folderId !== null) {
        const folder = await this.folderRepository.findById(dto.folderId);
        if (!folder || folder.userId !== userId || !folder.isActive()) {
          throw new Error('Folder not found or access denied');
        }
      }
    }

    if (dto.name && dto.name !== file.name) {
      const targetFolderId = dto.folderId !== undefined ? dto.folderId : file.folderId;
      const nameExists = await this.fileRepository.nameExistsInFolder(userId, targetFolderId, dto.name);
      if (nameExists) {
        throw new Error('File with this name already exists in the target folder');
      }
    }

    const updatedFile = await this.fileRepository.update(fileId, {
      name: dto.name,
      folderId: dto.folderId,
      description: dto.description,
      tags: dto.tags,
      metadata: dto.metadata,
    });

    return this.fileToDto(updatedFile);
  }

  private fileToDto(file: File): FileResponseDTO {
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
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      deletedAt: file.deletedAt?.toISOString(),
    };
  }
}
