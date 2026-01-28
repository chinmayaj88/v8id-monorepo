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
  deleteFileShare(id: string): Promise<void>;

  // Could add folder share methods later, keeping focus on files first as per request
}
