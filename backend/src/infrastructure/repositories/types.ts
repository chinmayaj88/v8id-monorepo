/**
 * Prisma Type Helpers
 * 
 * Type definitions for Prisma models to avoid using `any` types.
 */

import type { Prisma } from '../../../generated/prisma/client';

// User types
export type PrismaUser = Prisma.UserGetPayload<{}>;
export type PrismaUserCreateInput = Prisma.UserCreateInput;
export type PrismaUserUpdateInput = Prisma.UserUpdateInput;

// File types
export type PrismaFile = Prisma.FileGetPayload<{}>;
export type PrismaFileCreateInput = Prisma.FileCreateInput;
export type PrismaFileUpdateInput = Prisma.FileUpdateInput;
export type PrismaFileWhereInput = Prisma.FileWhereInput;
export type PrismaFileOrderByInput = Prisma.FileOrderByWithRelationInput;

// Folder types
export type PrismaFolder = Prisma.FolderGetPayload<{}>;
export type PrismaFolderCreateInput = Prisma.FolderCreateInput;
export type PrismaFolderUpdateInput = Prisma.FolderUpdateInput;
export type PrismaFolderWhereInput = Prisma.FolderWhereInput;

// Device Session types
export type PrismaDeviceSession = Prisma.DeviceSessionGetPayload<{}>;
export type PrismaDeviceSessionCreateInput = Prisma.DeviceSessionCreateInput;

// Upload Session types
export type PrismaUploadSession = Prisma.UploadSessionGetPayload<{}>;
export type PrismaUploadSessionCreateInput = Prisma.UploadSessionCreateInput;
export type PrismaUploadSessionUpdateInput = Prisma.UploadSessionUpdateInput;
export type PrismaUploadSessionWhereInput = Prisma.UploadSessionWhereInput;

// File Share types
export type PrismaFileShare = Prisma.FileShareGetPayload<{}>;
export type PrismaFileShareCreateInput = Prisma.FileShareCreateInput;
export type PrismaFileShareUpdateInput = Prisma.FileShareUpdateInput;

// Audit Log types
export type PrismaAuditLog = Prisma.AuditLogGetPayload<{}>;
export type PrismaAuditLogCreateInput = Prisma.AuditLogCreateInput;
export type PrismaAuditLogWhereInput = Prisma.AuditLogWhereInput;
