import { Folder } from '../../domain/entities/folder.js';

export interface IFolderRepository {

  findById(id: string): Promise<Folder | null>;

  create(folderData: {
    userId: string;
    parentId?: string | null;
    name: string;
    description?: string;
    color?: string;
  }): Promise<Folder>;

  update(id: string, data: Partial<{
    name?: string;
    parentId?: string | null;
    description?: string;
    color?: string;
    deletedAt?: Date | null;
  }>): Promise<Folder>;

  delete(id: string): Promise<void>;

  hardDelete(id: string): Promise<void>;


  restore(id: string): Promise<Folder>;


  findByUserId(userId: string, options?: {
    parentId?: string | null;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }>;

  findRootFolders(userId: string, options?: {
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }>;

  findChildren(parentId: string, userId: string, options?: {
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ folders: Folder[]; total: number }>;

  getFolderPath(folderId: string): Promise<Folder[]>;

  nameExistsInParent(userId: string, parentId: string | null, name: string): Promise<boolean>;

  hasChildren(folderId: string): Promise<boolean>;

  hasFiles(folderId: string): Promise<boolean>;

  move(folderId: string, newParentId: string | null): Promise<Folder>;

  wouldCreateCircularReference(folderId: string, newParentId: string | null): Promise<boolean>;

  hardDeleteRecursive(folderId: string): Promise<void>;

  hasActiveChildren(folderId: string): Promise<boolean>;

  hasActiveFiles(folderId: string): Promise<boolean>;
}
