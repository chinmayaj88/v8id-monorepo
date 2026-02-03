import {
  FileShare,
  FolderShare,
  ShareType,
  SharePermission,
} from '../../../../generated/prisma/index.js';

export interface CreateFileShareDTO {
  fileId: string;
  ownerId: string;
  type: ShareType;
  permission: SharePermission;
  sharedWith?: string; // Email for internal
  token?: string; // For public link
  expiresAt?: Date;
}

export interface IShareRepository {
  createFileShare(data: CreateFileShareDTO): Promise<FileShare>;
  findFileShareByToken(token: string): Promise<FileShare | null>;
  findFileSharesByFileId(fileId: string): Promise<FileShare[]>;
  findFileSharesByEmail(email: string): Promise<FileShare[]>; // Shared with me
  findFileSharesByOwner(ownerId: string): Promise<FileShare[]>; // Shared by me
  findFileShareById(id: string): Promise<FileShare | null>;
  deleteFileShare(id: string): Promise<void>;
  checkFileAccess(fileId: string, email: string): Promise<FileShare | null>;

  // Folder Share Support
  createFolderShare(data: CreateFolderShareDTO): Promise<FolderShare>;
  findFolderShareByToken(token: string): Promise<FolderShare | null>;
  findFolderShareByFolderId(folderId: string): Promise<FolderShare[]>;
  findFolderSharesByOwner(ownerId: string): Promise<FolderShare[]>;
  findFolderSharesByEmail(email: string): Promise<FolderShare[]>;
  findFolderShareById(id: string): Promise<FolderShare | null>;
  deleteFolderShare(id: string): Promise<void>;
  checkFolderAccess(folderId: string, email: string): Promise<FolderShare | null>;
}

export interface CreateFolderShareDTO {
  folderId: string;
  ownerId: string;
  type: ShareType;
  permission: SharePermission;
  sharedWith?: string; // Email for internal
  token?: string; // For public link
  expiresAt?: Date;
}
