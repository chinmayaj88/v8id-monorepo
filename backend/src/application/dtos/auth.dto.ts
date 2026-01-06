/**
 * Authentication DTOs
 * 
 * Data Transfer Objects for authentication operations.
 */

export interface LoginDTO {
  email: string;
  password: string;
  totpCode?: string; // Optional for backward compatibility (single-step login)
  deviceType: 'MOBILE' | 'WEB';
  deviceName: string;
  deviceId: string;
}

export interface VerifyCredentialsDTO {
  email: string;
  password: string;
}

export interface VerifyTotpDTO {
  tempToken: string;
  totpCode: string;
  deviceType: 'MOBILE' | 'WEB';
  deviceName: string;
  deviceId: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN';
  storageQuota?: number;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface TotpSetupDTO {
  // No input needed, uses authenticated user
}

export interface TotpVerifySetupDTO {
  totpCode: string;
}

export interface TotpDisableDTO {
  password: string;
  totpCode: string;
}

export interface TotpRegenerateBackupCodesDTO {
  password: string;
  totpCode: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

