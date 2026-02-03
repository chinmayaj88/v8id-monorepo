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
  rememberMe?: boolean;
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

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

