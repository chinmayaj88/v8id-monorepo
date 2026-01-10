/**
 * File DTOs
 * 
 * Data Transfer Objects for file operations.
 */

import { FileStatus, FileType } from '../../domain/entities/file';

export interface UploadFileDTO {
  folderId?: string | null;
  name?: string; // Optional display name (uses original filename if not provided)
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateFileDTO {
  name?: string;
  folderId?: string | null;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ListFilesDTO {
  folderId?: string | null;
  status?: FileStatus;
  type?: FileType;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
  orderDirection?: 'asc' | 'desc';
}

export interface MoveFileDTO {
  folderId: string | null; // null to move to root
}

export interface CreateFolderDTO {
  parentId?: string | null; // null for root folder
  name: string;
  description?: string;
  color?: string; // Hex color code
}

export interface UpdateFolderDTO {
  name?: string;
  parentId?: string | null;
  description?: string;
  color?: string;
}

export interface ListFoldersDTO {
  parentId?: string | null; // null for root folders
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface MoveFolderDTO {
  parentId: string | null; // null to move to root
}

export interface FileResponseDTO {
  id: string;
  userId: string;
  folderId: string | null;
  name: string;
  originalName: string;
  mimeType: string;
  size: number; // Convert BigInt to number for JSON
  type: FileType;
  status: FileStatus;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  deletedAt?: string; // ISO date string
}

export interface FolderResponseDTO {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  description?: string;
  color?: string;
  isDeleted: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  deletedAt?: string; // ISO date string
}
