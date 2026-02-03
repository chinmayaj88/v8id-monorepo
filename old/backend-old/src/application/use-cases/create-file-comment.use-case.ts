/**
 * Create File Comment Use Case
 * 
 * Add a comment/annotation to a file or folder.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { prisma } from '../../infrastructure/database/index.js';

export interface CreateFileCommentDTO {
  fileId?: string | null;
  folderId?: string | null;
  content: string;
}

export interface FileCommentResponse {
  id: string;
  fileId: string | null;
  folderId: string | null;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export class CreateFileCommentUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, dto: CreateFileCommentDTO): Promise<FileCommentResponse> {
    if ((!dto.fileId && !dto.folderId) || (dto.fileId && dto.folderId)) {
      throw new Error('Either fileId or folderId must be provided, but not both');
    }

    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error('Comment content is required');
    }

    if (dto.content.length > 5000) {
      throw new Error('Comment content must be less than 5000 characters');
    }

    if (dto.fileId) {
      const file = await this.fileRepository.findById(dto.fileId);
      if (!file || file.userId !== userId) {
        throw new Error('File not found or access denied');
      }
    } else if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== userId) {
        throw new Error('Folder not found or access denied');
      }
    }

    const comment = await prisma.fileComment.create({
      data: {
        userId,
        fileId: dto.fileId || null,
        folderId: dto.folderId || null,
        content: dto.content.trim(),
      },
    });

    return {
      id: comment.id,
      fileId: comment.fileId ?? null,
      folderId: comment.folderId ?? null,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }
}
