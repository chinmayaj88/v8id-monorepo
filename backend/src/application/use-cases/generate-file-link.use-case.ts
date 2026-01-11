/**
 * Generate File Link Use Case
 * 
 * Generate a temporary download link (pre-signed URL/PAR) for a file or folder.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service';
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
    if ((!dto.fileId && !dto.folderId) || (dto.fileId && dto.folderId)) {
      throw new Error('Either fileId or folderId must be provided, but not both');
    }

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
      throw new Error('Folder links not yet supported');
    }

    const linkToken = randomBytes(32).toString('hex');

    const expiresInHours = dto.expiresInHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    let parUrl: string | undefined;
    let parId: string | undefined;
    if (ociObjectName && dto.fileId) {
      try {
        // Use tier-aware storage service for PAR generation
        const isTierAware = this.storageService instanceof TierAwareStorageService;
        const file = await this.fileRepository.findById(dto.fileId);
        const storageTier = file?.storageTier || 'STANDARD' as any;

        if (isTierAware) {
          const parResult = await (this.storageService as TierAwareStorageService).createPreAuthenticatedRequest({
            objectName: ociObjectName,
            expiresInHours,
            accessType: 'ObjectRead',
            tier: storageTier,
          });
          parUrl = parResult.parUrl;
          parId = parResult.parId;
        } else {
          const parResult = await this.storageService.createPreAuthenticatedRequest({
            objectName: ociObjectName,
            expiresInHours,
            accessType: 'ObjectRead',
          });
          parUrl = parResult.parUrl;
          parId = parResult.parId;
        }
      } catch (error) {
        throw new Error(`Failed to generate download link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

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
