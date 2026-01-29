/**
 * File Validation Schemas
 *
 * Zod schemas for validating file-related requests.
 */

import { z } from 'zod';
import { FileStatus, FileType } from '../../../domain/entities/index.js';

/**
 * Create folder schema
 */
export const createFolderSchema = z.object({
  parentId: z.string().nullable().optional(),
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(255, 'Folder name must be less than 255 characters'),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code')
    .optional(),
});

/**
 * Update folder schema
 */
export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().nullable().optional(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

/**
 * Update file schema
 */
export const updateFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folderId: z.string().nullable().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * List files query schema
 */
export const listFilesQuerySchema = z.object({
  parentId: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  status: z.nativeEnum(FileStatus).optional(),
  type: z.nativeEnum(FileType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  orderBy: z.enum(['name', 'createdAt', 'updatedAt', 'size']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
});

/**
 * List folders query schema
 */
export const listFoldersQuerySchema = z.object({
  parentId: z.string().nullable().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const initiateUploadSchema = z.object({
  fileName: z.string().min(1).max(500),
  size: z.coerce.string().transform(v => BigInt(v)), // Support large numbers via string
  mimeType: z.string().min(1).max(100),
  folderId: z.string().nullable().optional(),
  path: z.string().optional(),
  tier: z.enum(['STANDARD', 'ARCHIVE']).optional(),
});

export const completeUploadSchema = z.object({
  storageKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  size: z.coerce.string().transform(v => BigInt(v)),
  folderId: z.string().nullable().optional(),
  tier: z.enum(['STANDARD', 'ARCHIVE']).optional(),
  ociUploadId: z.string().optional(),
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().positive(),
        etag: z.string().min(1),
      })
    )
    .optional(),
});
