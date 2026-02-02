/**
 * Prisma Type Helpers
 *
 * Type definitions for Prisma models to avoid using `any` types.
 */

import type { Prisma } from '../../../generated/prisma/index.js';

// User types
export type PrismaUser = Prisma.UserGetPayload<object>;
export type PrismaUserCreateInput = Prisma.UserCreateInput;
export type PrismaUserUpdateInput = Prisma.UserUpdateInput;

// Device Session types
export type PrismaDeviceSession = Prisma.DeviceSessionGetPayload<object>;
export type PrismaDeviceSessionCreateInput = Prisma.DeviceSessionCreateInput;

// Audit Log types
export type PrismaAuditLog = Prisma.AuditLogGetPayload<object>;
export type PrismaAuditLogCreateInput = Prisma.AuditLogCreateInput;
export type PrismaAuditLogWhereInput = Prisma.AuditLogWhereInput;
