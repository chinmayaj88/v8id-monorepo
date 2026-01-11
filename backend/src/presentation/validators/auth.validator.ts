/**
 * Auth Validation Schemas
 * 
 * Zod schemas for validating authentication-related requests.
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
 * TOTP code validation schema (6 digits)
 */
const totpCodeSchema = z
  .string()
  .length(6, 'TOTP code must be exactly 6 digits')
  .regex(/^\d{6}$/, 'TOTP code must contain only digits');

/**
 * Device type validation schema
 */
const deviceTypeSchema = z.enum(['MOBILE', 'WEB'], {
  message: 'Device type must be either MOBILE or WEB',
});

/**
 * Device name validation schema
 */
const deviceNameSchema = z
  .string()
  .min(1, 'Device name is required')
  .max(100, 'Device name must be less than 100 characters')
  .trim();

/**
 * Device ID validation schema
 */
const deviceIdSchema = z
  .string()
  .min(1, 'Device ID is required')
  .max(255, 'Device ID must be less than 255 characters')
  .trim();

/**
 * Verify Credentials Schema
 * POST /api/auth/verify-credentials
 */
export const verifyCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Verify TOTP Schema
 * POST /api/auth/verify-totp
 */
export const verifyTotpSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  totpCode: totpCodeSchema,
  deviceType: deviceTypeSchema,
  deviceName: deviceNameSchema,
  deviceId: deviceIdSchema,
});

/**
 * Refresh Token Schema
 * POST /api/auth/refresh
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Forgot Password Schema
 * POST /api/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset Password Schema
 * POST /api/auth/reset-password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

/**
 * Change Password Schema
 * POST /api/auth/change-password
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  totpCode: totpCodeSchema,
});

/**
 * Regenerate Backup Codes Schema
 * POST /api/auth/regenerate-backup-codes
 */
export const regenerateBackupCodesSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  totpCode: totpCodeSchema,
});

/**
 * Resetup TOTP Schema
 * POST /api/auth/resetup-totp
 */
export const resetupTotpSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

/**
 * Logout Schema
 * POST /api/auth/logout
 * Note: sessionId can come from body or x-session-id header, so body validation is optional
 */
export const logoutSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format').optional(),
}).passthrough();

// Type exports for TypeScript inference
export type VerifyCredentialsInput = z.infer<typeof verifyCredentialsSchema>;
export type VerifyTotpInput = z.infer<typeof verifyTotpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RegenerateBackupCodesInput = z.infer<typeof regenerateBackupCodesSchema>;
export type ResetupTotpInput = z.infer<typeof resetupTotpSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
