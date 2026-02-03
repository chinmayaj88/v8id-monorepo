export enum AuditEventType {
  // Authentication events
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  
  // TOTP events
  TOTP_VERIFIED = 'TOTP_VERIFIED',
  TOTP_VERIFICATION_FAILED = 'TOTP_VERIFICATION_FAILED',
  TOTP_SETUP = 'TOTP_SETUP',
  TOTP_RESETUP = 'TOTP_RESETUP',
  TOTP_RESETUP_ATTEMPT = 'TOTP_RESETUP_ATTEMPT',
  BACKUP_CODES_REGENERATED = 'BACKUP_CODES_REGENERATED',
  BACKUP_CODES_REGENERATE_ATTEMPT = 'BACKUP_CODES_REGENERATE_ATTEMPT',
  
  // Password events
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE = 'PASSWORD_RESET_COMPLETE',
  
  // User management events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  
  // Session events
  SESSION_REVOKED = 'SESSION_REVOKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Security events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export interface IAuditLogService {

  logEvent(data: {
    userId?: string;
    eventType: AuditEventType | string;
    eventData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void>;


  logLogin(
    userId: string | undefined,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      deviceType?: string;
      deviceName?: string;
      email?: string;
      errorMessage?: string;
    }
  ): Promise<void>;


  logLogout(
    userId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<void>;


  logTokenRefresh(
    userId: string,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    }
  ): Promise<void>;


  logTotpVerification(
    userId: string,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    }
  ): Promise<void>;


  logPasswordChange(
    userId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    }
  ): Promise<void>;

 
  logPasswordResetRequest(
    userId: string | undefined,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      email?: string;
      errorMessage?: string;
    }
  ): Promise<void>;


  logPasswordResetComplete(
    userId: string | undefined,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    }
  ): Promise<void>;


  logUserCreated(
    createdByUserId: string,
    newUserId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void>;


  logSessionRevoked(
    userId: string,
    sessionId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void>;

  logRateLimitExceeded(
    userId: string | undefined,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      endpoint?: string;
    }
  ): Promise<void>;
}
