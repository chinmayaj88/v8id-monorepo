/**
 * Unified Search Use Case
 *
 * Handles searching across both files and folders and returning a combined, ranked result set.
 */

import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import {
  UnifiedSearchDTO,
  UnifiedSearchResponseDTO,
  SearchResultItemDTO,
} from '../dtos/search.dto.js';
import { File } from '../../domain/entities/file.js';
import { Folder } from '../../domain/entities/folder.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { UrlCacheService } from '../../infrastructure/services/url-cache.service.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';
import { StorageTier } from '../../domain/entities/file.js';

export class UnifiedSearchUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService,
    private urlCache?: UrlCacheService
  ) {}

  async execute(userId: string, dto: UnifiedSearchDTO): Promise<UnifiedSearchResponseDTO> {
    const search = dto.search.trim();
    if (!search) {
      return { results: [], total: 0 };
    }

    const limit = dto.limit || 20;
    // We fetch a bit more than limit from each source to ensure we have enough candidates for ranking
    const fetchLimit = limit;

    // Execute searches in parallel
    const [filesResult, foldersResult] = await Promise.all([
      this.fileRepository.findByUserId(userId, { search, limit: fetchLimit }),
      this.folderRepository.findByUserId(userId, { search, limit: fetchLimit }),
    ]);

    const fileItems = await Promise.all(filesResult.files.map(f => this.mapFileToResult(f)));
    const folderItems = foldersResult.folders.map(f => this.mapFolderToResult(f));

    // Combine and Rank
    const combined = [...folderItems, ...fileItems];

    // Simple ranking logic:
    // 1. Exact match on name (case-insensitive)
    // 2. Starts with search term
    // 3. Contains search term
    const lowerSearch = search.toLowerCase();

    combined.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact match check
      const aExact = aName === lowerSearch;
      const bExact = bName === lowerSearch;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Starts with check
      const aStarts = aName.startsWith(lowerSearch);
      const bStarts = bName.startsWith(lowerSearch);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Alphabetical fallback
      return aName.localeCompare(bName);
    });

    // Apply pagination (if needed, though this basic version mostly handles top results)
    // Since we fetched 'limit' from both, we might have up to 2*limit items.
    // Real strict pagination across two tables is complex without a union query at DB level.
    // For now, we return the top ranked results up to 'limit'.
    const slicedResults = combined.slice(0, limit);

    return {
      results: slicedResults,
      total: filesResult.total + foldersResult.total,
    };
  }

  private async mapFileToResult(file: File): Promise<SearchResultItemDTO> {
    let thumbnailUrl: string | undefined;

    // Generate presigned URL for thumbnail logic (reused from ListFilesUseCase)
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
            ).generatePresignedUrl(file.thumbnailObjectName, 86400, StorageTier.STANDARD);
          } else {
            thumbnailUrl = await this.storageService.generatePresignedUrl(
              file.thumbnailObjectName,
              86400
            );
          }
          this.urlCache?.set(cacheKey, thumbnailUrl, 72000);
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
