/**
 * JWT Service
 * 
 * Handles JWT token generation and verification.
 */

import jwt from 'jsonwebtoken';
import { IJwtService, TokenPayload } from '../../application/interfaces/jwt-service.interface';

export class JwtService implements IJwtService {
  constructor(
    private jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    private accessTokenExpiresIn: string = process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    private refreshTokenExpiresIn: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  ) {}

  /**
   * Generate access token (short-lived: 15 minutes)
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token (long-lived: 7 days)
   */
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Generate temporary token (short-lived: 5 minutes)
   * Used for two-step login flow
   */
  generateTempToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '5m', // 5 minutes for temporary token
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode a token
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch (_error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get access token expiration time in seconds
   */
  getAccessTokenExpirationSeconds(): number {
    // Parse "15m" to seconds
    const expiresIn: string = this.accessTokenExpiresIn || '15m';
    
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match || !match[1] || !match[2]) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}

