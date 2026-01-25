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
   * Find files by user ID with optional filtering
   */
  findAllByUserId(
    userId: string,
    options?: {
      search?: string;
      tier?: StorageTier;
      isDeleted?: boolean;
      folderId?: string | null;
    }
  ): Promise<File[]>;

  /**
   * Check if file with same name exists in folder
   */
  existsByName(folderId: string | null, name: string, userId: string): Promise<boolean>;

  findDescendants(folderIds: string[], userId: string): Promise<File[]>;
}
