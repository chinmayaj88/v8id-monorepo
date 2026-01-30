import { File, StorageTier } from '../../../../generated/prisma/index.js';

export interface IFileRepository {
  create(data: {
    userId: string;
    folderId?: string | null;
    name: string;
    storageKey: string;
    storageTier: StorageTier;
    size: bigint;
    mimeType: string;
    extension?: string;
    thumbnailKey?: string;
    isOfflineAvailable?: boolean;
  }): Promise<File>;

  findById(id: string): Promise<File | null>;

  getStorageUsageByMimeType(userId: string): Promise<{ mimeType: string; totalSize: bigint }[]>;

  /**
   * Find all files in a specific folder (or root if folderId is null).
   */
  findByFolderId(folderId: string | null, userId: string): Promise<File[]>;

  update(id: string, data: Partial<File>): Promise<File>;

  delete(id: string): Promise<void>;

  /**
   * Soft delete a file
   */
  softDelete(id: string): Promise<void>;

  /**
   * Restore a soft-deleted file
   */
  restore(id: string): Promise<void>;

  /**
   * Find files by user ID with optional filtering
   */
  findAllByUserId(
    userId: string,
    options?: {
      search?: string;
      tier?: StorageTier;
      isDeleted?: boolean;
      folderId?: string | null;
      limit?: number;
      offset?: number;
    }
  ): Promise<File[]>;

  /**
   * Check if file with same name exists in folder
   */
  existsByName(folderId: string | null, name: string, userId: string): Promise<boolean>;

  findDescendants(folderIds: string[], userId: string, includeDeleted?: boolean): Promise<File[]>;

  /**
   * Find files updated since a specific date (for delta sync)
   */
  findUpdatedSince(userId: string, since: Date): Promise<File[]>;

  /**
   * Find contents by folder ID without user scope (for shared folders)
   */
  findContentsByFolderId(
    folderId: string,
    options?: {
      isDeleted?: boolean;
      tier?: StorageTier;
      limit?: number;
      offset?: number;
    }
  ): Promise<File[]>;
  /**
   * Get album aggregation for media types
   */
  getMediaAlbums(userId: string, type: 'image' | 'video' | 'document'): Promise<MediaAlbum[]>;
}

export interface MediaAlbum {
  folderId: string | null;
  folderName: string;
  count: number;
  thumbnailKey: string | null;
  thumbnailFileId: string | null;
}
