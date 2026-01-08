/**
 * Device Session Repository Interface
 * 
 * Defines the contract for device session data access operations.
 */

export interface DeviceSession {
  id: string;
  userId: string;
  deviceType: 'MOBILE' | 'WEB';
  deviceName: string;
  deviceId: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeviceSessionRepository {
  /**
   * Create a new device session
   */
  create(data: {
    userId: string;
    deviceType: 'MOBILE' | 'WEB';
    deviceName: string;
    deviceId: string;
    userAgent?: string;
    ipAddress?: string;
    location?: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<DeviceSession>;

  /**
   * Find session by refresh token
   */
  findByRefreshToken(refreshToken: string): Promise<DeviceSession | null>;

  /**
   * Find session by access token
   */
  findByAccessToken(accessToken: string): Promise<DeviceSession | null>;

  /**
   * Find active sessions for a user
   */
  findActiveSessionsByUserId(userId: string): Promise<DeviceSession[]>;

  /**
   * Count active sessions by type for a user
   */
  countActiveSessionsByType(
    userId: string,
    deviceType: 'MOBILE' | 'WEB'
  ): Promise<number>;

  /**
   * Revoke a session
   */
  revoke(sessionId: string): Promise<void>;

  /**
   * Revoke all sessions for a user
   */
  revokeAllForUser(userId: string): Promise<void>;

  /**
   * Update last active time
   */
  updateLastActive(sessionId: string): Promise<void>;

  /**
   * Update tokens for a session (for token rotation)
   */
  updateTokens(sessionId: string, accessToken: string, refreshToken: string): Promise<void>;

  /**
   * Delete expired sessions
   */
  deleteExpired(): Promise<number>;
}

