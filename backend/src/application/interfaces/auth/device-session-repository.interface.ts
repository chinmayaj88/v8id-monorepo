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
  rememberMe: boolean;
  lastActiveAt: Date;
  isActive: boolean;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeviceSessionRepository {

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
    rememberMe?: boolean;
  }): Promise<DeviceSession>;


  findByRefreshToken(refreshToken: string): Promise<DeviceSession | null>;

  findByAccessToken(accessToken: string): Promise<DeviceSession | null>;

  findActiveSessionsByUserId(userId: string): Promise<DeviceSession[]>;

  findRememberedMobileSession(userId: string): Promise<DeviceSession | null>;

  countActiveSessionsByType(
    userId: string,
    deviceType: 'MOBILE' | 'WEB'
  ): Promise<number>;

  revoke(sessionId: string): Promise<void>;

  revokeAllForUser(userId: string): Promise<void>;

  updateLastActive(sessionId: string): Promise<void>;

  updateTokens(sessionId: string, accessToken: string, refreshToken: string): Promise<void>;

  deleteExpired(): Promise<number>;

  /**
   * Find session by ID and verify it belongs to the user
   * Optimized for session revocation - single query instead of fetching all sessions
   */
  findByIdAndUserId(sessionId: string, userId: string): Promise<DeviceSession | null>;
}



