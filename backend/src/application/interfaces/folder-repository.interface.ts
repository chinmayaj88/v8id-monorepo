/**
 * Folder Repository Interface
 * 
 * Defines the contract for folder data access operations.
 */

import { Folder } from '../../domain/entities/folder';

export interface IFolderRepository {
  /**
   * Find folder by ID
   */
  findById(id: string): Promise<Folder | null>;

  /**
   * Create a new folder
   */
  create(folderData: {
    userId: string;
    parentId?: string | null;
    name: string;
    description?: string;
    color?: string;
  }): Promise<Folder>;

  /**
   * Update folder
   */
  update(id: string, data: Partial<{
    name?: string;
    parentId?: string | null;
    description?: string;
    color?: string;
    deletedAt?: Date | null;
  }>): Promise<Folder>;

  /**
   * Delete folder (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Hard delete folder (permanent)
   */
  hardDelete(id: string): Promise<void>;

  /**
   * Restore deleted folder
   */
  restore(id: string): Promise<Folder>;

  /**
   * List folders for a user
   */
  findByUserId(userId: string, options?: {
    parentId?: string | null;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }>;

  /**
   * Get root folders (folders without parent)
   */
  findRootFolders(userId: string, options?: {
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }>;

  /**
   * Get child folders
   */
  findChildren(parentId: string, userId: string, options?: {
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }>;

  /**
   * Get folder path (breadcrumb)
   */
  getFolderPath(folderId: string): Promise<Folder[]>;

  /**
   * Check if folder name exists in parent
   */
  nameExistsInParent(userId: string, parentId: string | null, name: string): Promise<boolean>;

  /**
   * Check if folder has children
   */
  hasChildren(folderId: string): Promise<boolean>;

  /**
   * Check if folder has files
   */
  hasFiles(folderId: string): Promise<boolean>;

  /**
   * Move folder to new parent
   */
  move(folderId: string, newParentId: string | null): Promise<Folder>;

  /**
   * Check if moving folder would create circular reference
   */
  wouldCreateCircularReference(folderId: string, newParentId: string | null): Promise<boolean>;

  /**
   * Hard delete folder and all its subfolders recursively
   */
  hardDeleteRecursive(folderId: string): Promise<void>;

  /**
   * Check if folder has active children (not deleted)
   */
  hasActiveChildren(folderId: string): Promise<boolean>;

  /**
   * Check if folder has active files (not deleted)
   */
  hasActiveFiles(folderId: string): Promise<boolean>;
}
