/**
 * List File Versions Use Case
 * 
 * List all versions of a file.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { prisma } from '../../infrastructure/database/index.js';

export interface FileVersionResponse {
  id: string;
  versionNumber: number;
  size: number;
  hash: string;
  createdAt: string;
}

export interface ListFileVersionsResult {
  versions: FileVersionResponse[];
  total: number;
}

export class ListFileVersionsUseCase {
  constructor(
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, fileId: string): Promise<ListFileVersionsResult> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    const versions = await prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { versionNumber: 'desc' },
    });

    return {
      versions: versions.map(v => ({
        id: v.id,
        versionNumber: v.versionNumber,
        size: Number(v.size),
        hash: v.hash,
        createdAt: v.createdAt.toISOString(),
      })),
      total: versions.length,
    };
  }
}
