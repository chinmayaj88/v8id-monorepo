export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion?: number;
}

export interface IJwtService {

  generateAccessToken(payload: TokenPayload): string;

  generateRefreshToken(payload: TokenPayload): string;

  generateTempToken(payload: TokenPayload): string;

  verifyToken(token: string): TokenPayload;

  decodeToken(token: string): TokenPayload | null;

  getAccessTokenExpirationSeconds(): number;
}


