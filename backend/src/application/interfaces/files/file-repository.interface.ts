import { File, FileStatus, FileType, StorageTier } from '../../../domain/entities/index.js';

export interface IFileRepository {
  findById(id: string): Promise<File | null>;
  findByOciObjectName(ociObjectName: string): Promise<File | null>;
  findByHash(hash: string, userId: string): Promise<File | null>;

  create(fileData: {
    userId: string;
    folderId?: string | null;
    name: string;
    originalName: string;
    mimeType: string;
    size: bigint;
    type: FileType;
    status: FileStatus;
    storageTier?: StorageTier;
    ociObjectName: string;
    hash: string;
    thumbnailObjectName?: string;
    thumbnailGenerated?: boolean;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<File>;

  update(
    id: string,
    data: Partial<{
      name?: string;
      folderId?: string | null;
      description?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      status?: FileStatus;
      deletedAt?: Date | null;
      expiresAt?: Date | null;
      thumbnailObjectName?: string | null;
      thumbnailGenerated?: boolean;
    }>
  ): Promise<File>;

  delete(id: string): Promise<void>;

  hardDelete(id: string): Promise<void>;

  /**
   * Batch hard delete files (optimized for bulk operations)
   */
  batchHardDelete(fileIds: string[]): Promise<number>;

  restore(id: string): Promise<File>;

  findByUserId(
    userId: string,
    options?: {
      folderId?: string | null;
      status?: FileStatus;
      type?: FileType;
      search?: string;
      page?: number;
      limit?: number;
      orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<{ files: File[]; total: number }>;

  findByFolderId(
    folderId: string,
    userId: string,
    options?: {
      status?: FileStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ files: File[]; total: number }>;

  findRootFiles(
    userId: string,
    options?: {
      status?: FileStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ files: File[]; total: number }>;

  getStorageUsedByUser(userId: string): Promise<bigint>;

  getStorageAnalytics(userId: string): Promise<Record<FileType, bigint>>;

  findByStatus(
    status: FileStatus,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ files: File[]; total: number }>;

  updateStatus(id: string, status: FileStatus): Promise<File>;

  nameExistsInFolder(userId: string, folderId: string | null, name: string): Promise<boolean>;

  findByFolderIdRecursive(folderId: string): Promise<File[]>;

  /**
   * Batch update file status (optimized for bulk operations)
   */
  batchUpdateStatus(fileIds: string[], status: FileStatus): Promise<number>;

  /**
   * Batch update folder ID (optimized for bulk move)
   */
  batchUpdateFolder(userId: string, fileIds: string[], folderId: string | null): Promise<number>;

  /**
   * Find all expired files (expiresAt <= now AND status = ACTIVE)
   * Optimized for auto-delete scheduled jobs
   */
  findExpiredFiles(): Promise<File[]>;
}


