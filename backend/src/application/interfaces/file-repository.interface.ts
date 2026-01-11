/**
 * File Repository Interface
 * 
 * Defines the contract for file data access operations.
 */

import { File, FileStatus, FileType } from '../../domain/entities/file';

export interface IFileRepository {
  /**
   * Find file by ID
   */
  findById(id: string): Promise<File | null>;

  /**
   * Find file by OCI object name
   */
  findByOciObjectName(ociObjectName: string): Promise<File | null>;

  /**
   * Find file by hash (for deduplication)
   */
  findByHash(hash: string, userId: string): Promise<File | null>;

  /**
   * Create a new file record
   */
  create(fileData: {
    userId: string;
    folderId?: string | null;
    name: string;
    originalName: string;
    mimeType: string;
    size: bigint;
    type: FileType;
    status: FileStatus;
    ociObjectName: string;
    hash: string;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<File>;

  /**
   * Update file
   */
  update(id: string, data: Partial<{
    name?: string;
    folderId?: string | null;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    status?: FileStatus;
    deletedAt?: Date | null;
  }>): Promise<File>;

  /**
   * Delete file (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Hard delete file (permanent)
   */
  hardDelete(id: string): Promise<void>;

  /**
   * Restore deleted file
   */
  restore(id: string): Promise<File>;

  /**
   * List files for a user
   */
  findByUserId(userId: string, options?: {
    folderId?: string | null;
    status?: FileStatus;
    type?: FileType;
    search?: string;
    page?: number;
    limit?: number;
    orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
    orderDirection?: 'asc' | 'desc';
  }): Promise<{ files: File[]; total: number }>;

  /**
   * Get files by folder ID
   */
  findByFolderId(folderId: string, userId: string, options?: {
    status?: FileStatus;
    page?: number;
    limit?: number;
  }): Promise<{ files: File[]; total: number }>;

  /**
   * Get root files (files without folder)
   */
  findRootFiles(userId: string, options?: {
    status?: FileStatus;
    page?: number;
    limit?: number;
  }): Promise<{ files: File[]; total: number }>;

  /**
   * Get total storage used by user
   */
  getStorageUsedByUser(userId: string): Promise<bigint>;

  /**
   * Get files by status
   */
  findByStatus(status: FileStatus, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ files: File[]; total: number }>;

  /**
   * Update file status
   */
  updateStatus(id: string, status: FileStatus): Promise<File>;

  /**
   * Check if file name exists in folder
   */
  nameExistsInFolder(userId: string, folderId: string | null, name: string): Promise<boolean>;

  /**
   * Find all files in a folder recursively (including subfolders)
   */
  findByFolderIdRecursive(folderId: string): Promise<File[]>;
}
