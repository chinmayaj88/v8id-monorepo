import { File, FileStatus, FileType } from '../../domain/entities/file';

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
    ociObjectName: string;
    hash: string;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<File>;


  update(id: string, data: Partial<{
    name?: string;
    folderId?: string | null;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    status?: FileStatus;
    deletedAt?: Date | null;
    expiresAt?: Date | null;
  }>): Promise<File>;

  delete(id: string): Promise<void>;

  hardDelete(id: string): Promise<void>;

  restore(id: string): Promise<File>;

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

  findByFolderId(folderId: string, userId: string, options?: {
    status?: FileStatus;
    page?: number;
    limit?: number;
  }): Promise<{ files: File[]; total: number }>;

  findRootFiles(userId: string, options?: {
    status?: FileStatus;
    page?: number;
    limit?: number;
  }): Promise<{ files: File[]; total: number }>;

  getStorageUsedByUser(userId: string): Promise<bigint>;

  findByStatus(status: FileStatus, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ files: File[]; total: number }>;

  updateStatus(id: string, status: FileStatus): Promise<File>;

  nameExistsInFolder(userId: string, folderId: string | null, name: string): Promise<boolean>;

  findByFolderIdRecursive(folderId: string): Promise<File[]>;
}
