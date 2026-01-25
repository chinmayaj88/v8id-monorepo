import { Folder } from '../../../../generated/prisma/index.js';

export interface IFolderRepository {
  create(data: {
    userId: string;
    parentId?: string | null;
    name: string;
    path: string;
  }): Promise<Folder>;

  findById(id: string): Promise<Folder | null>;

  /**
   * Find all folders in a specific parent folder (or root if parentId is null).
   */
  findByParentId(parentId: string | null, userId: string): Promise<Folder[]>;

  update(id: string, data: Partial<Folder>): Promise<Folder>;

  delete(id: string): Promise<void>;

  softDelete(id: string): Promise<void>;

  /**
   * Check if folder with same name exists in parent folder
   */
  existsByName(parentId: string | null, name: string, userId: string): Promise<boolean>;

  /**
   * Get all descendants of a folder (for recursive operations like delete/move)
   * Uses the materialized path for efficiency.
   */
  findDescendants(folderId: string, userId: string): Promise<Folder[]>;

  findAllByUserId(userId: string): Promise<Folder[]>;
}
