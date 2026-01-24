/**
 * List Files Use Case
 *
 * Handles file listing with filtering, pagination, and sorting.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { ListFilesDTO } from '../dtos/file.dto.js';
import { SearchResultItemDTO } from '../dtos/search.dto.js';
import { File, FileStatus, StorageTier } from '../../domain/entities/file.js';
import { Folder } from '../../domain/entities/folder.js';
import { UrlCacheService } from '../../infrastructure/services/url-cache.service.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';

export interface ListFilesResult {
  items: SearchResultItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService,
    private urlCache?: UrlCacheService
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

    // Determine how to fetch folders based on the context
    let foldersPromise: Promise<{ folders: Folder[]; total: number }>;

    if (dto.search) {
      foldersPromise = this.folderRepository.findByUserId(userId, {
        search: dto.search,
        includeDeleted: status === FileStatus.DELETED,
        page,
        limit,
      });
    } else if (dto.folderId === null) {
      foldersPromise = this.folderRepository.findRootFolders(userId, {
        includeDeleted: status === FileStatus.DELETED,
        page,
        limit,
      });
    } else if (dto.folderId) {
      foldersPromise = this.folderRepository.findChildren(dto.folderId, userId, {
        includeDeleted: status === FileStatus.DELETED,
        page,
        limit,
      });
    } else if (status === FileStatus.DELETED) {
      foldersPromise = this.folderRepository
        .findByUserId(userId, {
          includeDeleted: true,
          page,
          limit,
        })
        .then(res => ({
          folders: res.folders.filter(f => f.isDeleted),
          total: res.folders.filter(f => f.isDeleted).length,
        }));
    } else {
      foldersPromise = Promise.resolve({ folders: [], total: 0 });
    }

    const [filesResult, foldersResult] = await Promise.all([
      this.fileRepository.findByUserId(userId, options),
      foldersPromise,
    ]);

    return await this.formatResult(
      filesResult.files,
      foldersResult.folders,
      filesResult.total + foldersResult.total,
      page,
      limit
    );
  }

  private async formatResult(
    files: File[],
    folders: Folder[],
    total: number,
    page: number,
    limit: number
  ): Promise<ListFilesResult> {
    const fileItems = await Promise.all(files.map(file => this.mapFileToResult(file)));
    const folderItems = folders.map(folder => this.mapFolderToResult(folder));

    // Combine folders first, then files (common pattern in file explorers)
    const combined = [...folderItems, ...fileItems];

    return {
      items: combined.slice(0, limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async mapFileToResult(file: File): Promise<SearchResultItemDTO> {
    let thumbnailUrl: string | undefined;

    // Generate presigned URL for thumbnail (reused logic)
    if (file.hasThumbnail() && file.thumbnailObjectName) {
      try {
        const cacheKey = `thumbnail:${file.thumbnailObjectName}`;
        const cachedUrl = this.urlCache?.get(cacheKey);

        if (cachedUrl) {
          thumbnailUrl = cachedUrl;
        } else {
          const isTierAware = this.storageService instanceof TierAwareStorageService;
          if (isTierAware) {
            thumbnailUrl = await (
              this.storageService as TierAwareStorageService
            ).generatePresignedUrl(file.thumbnailObjectName, 604800, StorageTier.STANDARD);
          } else {
            thumbnailUrl = await this.storageService.generatePresignedUrl(
              file.thumbnailObjectName,
              604800
            );
          }
          this.urlCache?.set(cacheKey, thumbnailUrl, 600000);
        }
      } catch (error) {
        // Ignore error
      }
    }

    return {
      id: file.id,
      type: 'file',
      name: file.name,
      description: file.description,
      updatedAt: file.updatedAt.toISOString(),
      mimeType: file.mimeType,
      size: Number(file.size),
      thumbnailUrl,
    };
  }

  private mapFolderToResult(folder: Folder): SearchResultItemDTO {
    return {
      id: folder.id,
      type: 'folder',
      name: folder.name,
      description: folder.description,
      updatedAt: folder.updatedAt.toISOString(),
      color: folder.color,
      parentId: folder.parentId,
    };
  }
}
