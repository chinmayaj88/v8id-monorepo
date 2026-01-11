/**
 * Generate File Link Use Case
 * 
 * Generate a temporary download link (pre-signed URL/PAR) for a file or folder.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { prisma } from '../../infrastructure/database';
import { randomBytes } from 'crypto';

export interface GenerateFileLinkDTO {
  fileId?: string | null;
  folderId?: string | null;
  expiresInHours?: number;
  maxDownloads?: number;
}

export interface FileLinkResponse {
  id: string;
  linkToken: string;
  linkUrl: string;
  expiresAt: string;
  maxDownloads?: number;
  downloadCount: number;
}

export class GenerateFileLinkUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, dto: GenerateFileLinkDTO): Promise<FileLinkResponse> {
    // 1. Validate that either fileId or folderId is provided
    if ((!dto.fileId && !dto.folderId) || (dto.fileId && dto.folderId)) {
      throw new Error('Either fileId or folderId must be provided, but not both');
    }

    // 2. Verify file/folder exists and user has access
    let ociObjectName: string | null = null;
    if (dto.fileId) {
      const file = await this.fileRepository.findById(dto.fileId);
      if (!file || file.userId !== userId) {
        throw new Error('File not found or access denied');
      }
      if (!file.isActive()) {
        throw new Error('Cannot generate link for deleted or archived files');
      }
      ociObjectName = file.ociObjectName;
    } else if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== userId) {
        throw new Error('Folder not found or access denied');
      }
      // For folders, we'd need to create a zip or handle differently
      // For now, throw error (folder links not fully supported)
      throw new Error('Folder links not yet supported');
    }

    // 3. Generate link token
    const linkToken = randomBytes(32).toString('hex');

    // 4. Calculate expiration
    const expiresInHours = dto.expiresInHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // 5. Generate PAR for direct access
    let parUrl: string | undefined;
    let parId: string | undefined;
    if (ociObjectName) {
      try {
        const parResult = await this.storageService.createPreAuthenticatedRequest({
          objectName: ociObjectName,
          expiresInHours,
          accessType: 'ObjectRead',
        });
        parUrl = parResult.parUrl;
        parId = parResult.parId;
      } catch (error) {
        throw new Error(`Failed to generate download link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 6. Create link record
    const link = await prisma.fileLink.create({
      data: {
        userId,
        fileId: dto.fileId || null,
        folderId: dto.folderId || null,
        linkToken,
        parUrl: parUrl || null,
        parId: parId || null,
        expiresAt,
        maxDownloads: dto.maxDownloads || null,
        downloadCount: 0,
        isActive: true,
      },
    });

    // 7. Construct public link URL (would be something like /api/files/link/:token)
    const linkUrl = `/api/files/link/${linkToken}`;

    return {
      id: link.id,
      linkToken: link.linkToken,
      linkUrl,
      expiresAt: link.expiresAt.toISOString(),
      maxDownloads: link.maxDownloads ?? undefined,
      downloadCount: link.downloadCount,
    };
  }
}
