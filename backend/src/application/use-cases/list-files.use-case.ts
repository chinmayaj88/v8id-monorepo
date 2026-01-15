/**
 * List Files Use Case
 * 
 * Handles file listing with filtering, pagination, and sorting.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { ListFilesDTO, FileResponseDTO } from '../dtos/file.dto.js';
import { File } from '../../domain/entities/file.js';
import { UrlCacheService } from '../../infrastructure/services/url-cache.service.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';
import { StorageTier } from '../../domain/entities/file.js';

export interface ListFilesResult {
  files: FileResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
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

    // If folderId is explicitly null, get root files
    if (dto.folderId === null) {
      const result = await this.fileRepository.findRootFiles(userId, {
        status,
        page,
        limit,
      });
      return await this.formatResult(result.files, result.total, page, limit);
    }

    // Otherwise, get files by folder or all files
    const result = await this.fileRepository.findByUserId(userId, options);
    return await this.formatResult(result.files, result.total, page, limit);
  }

  private async formatResult(files: File[], total: number, page: number, limit: number): Promise<ListFilesResult> {
    // Generate thumbnail URLs in parallel for better performance
    const fileDtos = await Promise.all(
      files.map(file => this.fileToDto(file))
    );

    return {
      files: fileDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async fileToDto(file: File): Promise<FileResponseDTO> {
    let thumbnailUrl: string | undefined;
    
    // Generate presigned URL for thumbnail if it exists
    if (file.hasThumbnail() && file.thumbnailObjectName) {
      try {
        // Check cache first (reduces OCI API calls)
        const cacheKey = `thumbnail:${file.thumbnailObjectName}`;
        const cachedUrl = this.urlCache?.get(cacheKey);
        
        if (cachedUrl) {
          thumbnailUrl = cachedUrl;
        } else {
          // Use tier-aware storage service - thumbnails are always in STANDARD tier
          const isTierAware = this.storageService instanceof TierAwareStorageService;
          
          if (isTierAware) {
            // Thumbnails are always in STANDARD tier for fast access
            thumbnailUrl = await (this.storageService as TierAwareStorageService).generatePresignedUrl(
              file.thumbnailObjectName,
              86400, // 24 hours expiration
              StorageTier.STANDARD
            );
          } else {
            thumbnailUrl = await this.storageService.generatePresignedUrl(
              file.thumbnailObjectName,
              86400 // 24 hours expiration
            );
          }
          
          // Cache the URL (cache for 20 hours to ensure it's valid)
          this.urlCache?.set(cacheKey, thumbnailUrl, 72000);
        }
      } catch (error) {
        // Thumbnail URL generation failed - non-critical
        // Continue without thumbnail URL
      }
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
      storageTier: file.storageTier,
      thumbnailUrl,
      thumbnailGenerated: file.thumbnailGenerated,
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
