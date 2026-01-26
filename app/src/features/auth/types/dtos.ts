export interface LoginRequest {
  email: string;
  password?: string;
  token?: string; // For TOTP
}

export interface RegisterRequest {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isTwoFactorEnabled: boolean;
  };
}
