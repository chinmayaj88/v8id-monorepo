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

