/**
 * List Files Use Case
 * 
 * Handles file listing with filtering, pagination, and sorting.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { ListFilesDTO, FileResponseDTO } from '../dtos/file.dto';
import { File } from '../../domain/entities/file';

export interface ListFilesResult {
  files: FileResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListFilesUseCase {
  constructor(
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, dto: ListFilesDTO): Promise<ListFilesResult> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const status = dto.status || undefined;

    // Build query options
    const options = {
      folderId: dto.folderId !== undefined ? dto.folderId : undefined,
      status,
      type: dto.type,
      search: dto.search,
      page,
      limit,
      orderBy: dto.orderBy || 'createdAt',
      orderDirection: (dto.orderDirection || 'desc') as 'asc' | 'desc',
    };

    // If folderId is explicitly null, get root files
    if (dto.folderId === null) {
      const result = await this.fileRepository.findRootFiles(userId, {
        status,
        page,
        limit,
      });
      return this.formatResult(result.files, result.total, page, limit);
    }

    // Otherwise, get files by folder or all files
    const result = await this.fileRepository.findByUserId(userId, options);
    return this.formatResult(result.files, result.total, page, limit);
  }

  private formatResult(files: File[], total: number, page: number, limit: number): ListFilesResult {
    return {
      files: files.map(this.fileToDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
      expiresAt: file.expiresAt?.toISOString(),
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      deletedAt: file.deletedAt?.toISOString(),
    };
  }
}
