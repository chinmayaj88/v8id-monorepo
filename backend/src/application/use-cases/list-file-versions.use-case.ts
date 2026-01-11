/**
 * List File Versions Use Case
 * 
 * List all versions of a file.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { prisma } from '../../infrastructure/database';

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
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Get all versions
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
