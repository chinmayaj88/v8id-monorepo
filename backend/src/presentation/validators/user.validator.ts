/**
 * User Validation Schemas
 * 
 * Zod schemas for validating user-related requests.
 */

import { z } from 'zod';

/**
 * Email validation schema
 */
const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();

/**
 * Password validation schema
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Name validation schema
 */
const nameSchema = z
  .string()
  .max(100, 'Name must be less than 100 characters')
  .trim()
  .optional();

/**
 * Avatar URL validation schema
 */
const avatarUrlSchema = z
  .string()
  .url('Invalid URL format')
  .max(500, 'Avatar URL must be less than 500 characters')
  .optional();

/**
 * Create User Schema (Admin only)
 * POST /api/users
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(['USER', 'ADMIN']).optional(),
  storageQuota: z.number().int().positive().optional(),
});

/**
 * Update Current User Schema
 * PATCH /api/users/me
 */
export const updateCurrentUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  avatarUrl: avatarUrlSchema,
});

/**
 * List Users Schema
 * GET /api/users?page=1&limit=50&search=query
 */
export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().max(100).trim().optional(),
});

/**
 * Revoke Session Schema
 * DELETE /api/users/me/sessions/:sessionId
 */
export const revokeSessionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
});

// Type exports for TypeScript inference (available for future use)
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateCurrentUserInput = z.infer<typeof updateCurrentUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;
