/**
 * Audit Log Service
 * 
 * Service for logging security events and audit trails.
 */

import { IAuditLogRepository } from '../../application/interfaces/audit-log-repository.interface';
import { IAuditLogService, AuditEventType } from '../../application/interfaces/audit-log-service.interface';

export { AuditEventType };

export class AuditLogService implements IAuditLogService {
  constructor(private auditLogRepository: IAuditLogRepository) {}

  /**
   * Log a security event
   */
  async logEvent(data: {
    userId?: string;
    eventType: AuditEventType | string;
    eventData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.auditLogRepository.create({
        userId: data.userId,
        eventType: data.eventType,
        eventData: data.eventData,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      });
    } catch (error) {
      // Don't throw - audit logging should never break the application
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log login attempt
   * @param userId - User ID (optional, undefined/null for unknown users)
   */
  async logLogin(
    userId: string | undefined,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      deviceType?: string;
      deviceName?: string;
      email?: string; // Email address of the user attempting to login
      errorMessage?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId: userId || undefined, // Convert empty string to undefined
      eventType: success ? AuditEventType.LOGIN : AuditEventType.LOGIN_FAILED,
      eventData: {
        deviceType: options?.deviceType,
        deviceName: options?.deviceName,
        email: options?.email, // Store email in eventData for tracking
      },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log logout
   */
  async logLogout(
    userId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: AuditEventType.LOGOUT,
      eventData: {
        sessionId: options?.sessionId,
      },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: true,
    });
  }

  /**
   * Log token refresh
   */
  async logTokenRefresh(
    userId: string,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: success ? AuditEventType.TOKEN_REFRESH : AuditEventType.TOKEN_REFRESH_FAILED,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log TOTP verification
   */
  async logTotpVerification(
    userId: string,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: success ? AuditEventType.TOTP_VERIFIED : AuditEventType.TOTP_VERIFICATION_FAILED,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log password change
   */
  async logPasswordChange(
    userId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: AuditEventType.PASSWORD_CHANGE,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: options?.success ?? true,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log password reset request
   */
  async logPasswordResetRequest(
    userId: string | undefined,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      email?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId: userId || undefined,
      eventType: AuditEventType.PASSWORD_RESET_REQUEST,
      eventData: {
        email: options?.email,
      },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log password reset completion
   */
  async logPasswordResetComplete(
    userId: string | undefined,
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId: userId || undefined,
      eventType: AuditEventType.PASSWORD_RESET_COMPLETE,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log user creation
   */
  async logUserCreated(
    createdByUserId: string,
    newUserId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId: createdByUserId,
      eventType: AuditEventType.USER_CREATED,
      eventData: {
        createdUserId: newUserId,
      },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: true,
    });
  }

  /**
   * Log session revocation
   */
  async logSessionRevoked(
    userId: string,
    sessionId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: AuditEventType.SESSION_REVOKED,
      eventData: {
        sessionId,
      },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: true,
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    userId: string | undefined,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      endpoint?: string;
    }
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
      eventData: {
        endpoint: options?.endpoint,
      },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: false,
    });
  }
}
