/**
 * JWT Service Interface
 * 
 * Defines the contract for JWT token generation and verification operations.
 */

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion?: number; // Token version for invalidation on password change
}

export interface IJwtService {
  /**
   * Generate access token (short-lived: 15 minutes)
   */
  generateAccessToken(payload: TokenPayload): string;

  /**
   * Generate refresh token (long-lived: 7 days)
   */
  generateRefreshToken(payload: TokenPayload): string;

  /**
   * Generate temporary token (short-lived: 5 minutes)
   * Used for two-step login flow
   */
  generateTempToken(payload: TokenPayload): string;

  /**
   * Verify and decode a token
   */
  verifyToken(token: string): TokenPayload;

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): TokenPayload | null;

  /**
   * Get access token expiration time in seconds
   */
  getAccessTokenExpirationSeconds(): number;
}
