/**
 * JWT Service
 * 
 * Handles JWT token generation and verification.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion?: number; // Token version for invalidation on password change
}

export class JwtService {
  /**
   * Generate access token (short-lived: 15 minutes)
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token (long-lived: 7 days)
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generate temporary token (short-lived: 5 minutes)
   * Used for two-step login flow
   */
  static generateTempToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '5m', // 5 minutes for temporary token
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode a token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      const secret: string = JWT_SECRET || 'your-secret-key-change-in-production';
      return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get access token expiration time in seconds
   */
  static getAccessTokenExpirationSeconds(): number {
    // Parse "15m" to seconds
    const expiresIn: string = ACCESS_TOKEN_EXPIRES_IN || '15m';
    
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

