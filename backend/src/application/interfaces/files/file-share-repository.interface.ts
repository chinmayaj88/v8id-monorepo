import { FileShare, SharePermission } from '../../../domain/entities/index.js';

export interface IFileShareRepository {
  findById(id: string): Promise<FileShare | null>;
  
  create(shareData: {
    fileId?: string | null;
    folderId?: string | null;
    ownerId: string;
    sharedWithId: string;
    permission: SharePermission;
  }): Promise<FileShare>;

  update(id: string, data: Partial<{
    permission: SharePermission;
  }>): Promise<FileShare>;

  delete(id: string): Promise<void>;

  findByFileId(fileId: string): Promise<FileShare[]>;
  
  findByFolderId(folderId: string): Promise<FileShare[]>;
  
  findBySharedWith(userId: string): Promise<FileShare[]>;
  
  findByOwner(ownerId: string): Promise<FileShare[]>;
  
  findShare(fileId: string | null, folderId: string | null, sharedWithId: string): Promise<FileShare | null>;
  
  hasAccess(userId: string, fileId: string | null, folderId: string | null): Promise<boolean>;
  
  getPermission(userId: string, fileId: string | null, folderId: string | null): Promise<SharePermission | null>;
}


