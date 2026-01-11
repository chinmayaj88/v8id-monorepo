import { IAuditLogRepository } from '../../application/interfaces/audit-log-repository.interface';
import { ISuspiciousActivityService, SuspiciousActivityDetectionResult } from '../../application/interfaces/suspicious-activity-service.interface';
import { AuditEventType } from '../../application/interfaces/audit-log-service.interface';

export class SuspiciousActivityService implements ISuspiciousActivityService {
  constructor(private auditLogRepository: IAuditLogRepository) {}

  async detectFailedLoginPattern(
    userId: string | undefined,
    ipAddress?: string
  ): Promise<SuspiciousActivityDetectionResult> {
    if (!userId) {
      return { isSuspicious: false, activityType: null };
    }

    const since = new Date();
    since.setMinutes(since.getMinutes() - 15);

    const failedLogins = await this.auditLogRepository.findByUserIdAndEventType(
      userId,
      AuditEventType.LOGIN_FAILED,
      since
    );

    if (failedLogins.length >= 3) {
      return {
        isSuspicious: true,
        activityType: 'MULTIPLE_FAILED_LOGINS',
        details: {
          count: failedLogins.length,
          timeWindow: '15 minutes',
          ipAddress,
          recentAttempts: failedLogins.slice(0, 5).map((log) => ({
            timestamp: log.createdAt,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
          })),
        },
      };
    }

    return { isSuspicious: false, activityType: null };
  }

  async detectFailedTotpPattern(
    userId: string,
    ipAddress?: string
  ): Promise<SuspiciousActivityDetectionResult> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - 15);

    const failedTotpAttempts = await this.auditLogRepository.findByUserIdAndEventType(
      userId,
      AuditEventType.TOTP_VERIFICATION_FAILED,
      since
    );

    if (failedTotpAttempts.length >= 3) {
      return {
        isSuspicious: true,
        activityType: 'MULTIPLE_FAILED_TOTP',
        details: {
          count: failedTotpAttempts.length,
          timeWindow: '15 minutes',
          ipAddress,
          recentAttempts: failedTotpAttempts.slice(0, 5).map((log) => ({
            timestamp: log.createdAt,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
          })),
        },
      };
    }

    return { isSuspicious: false, activityType: null };
  }

  async detectUnusualLocation(
    userId: string,
    ipAddress?: string,
    location?: string
  ): Promise<SuspiciousActivityDetectionResult> {
    if (!ipAddress) {
      return { isSuspicious: false, activityType: null };
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { logs } = await this.auditLogRepository.findByUserId(userId, {
      page: 1,
      limit: 50,
      eventType: AuditEventType.LOGIN,
    });

    const recentLogins = logs.filter((log) => log.createdAt >= since);

    if (recentLogins.length === 0) {
      return { isSuspicious: false, activityType: null };
    }

    const uniqueIpAddresses = new Set(
      recentLogins
        .map((log) => log.ipAddress)
        .filter((ip): ip is string => !!ip)
    );

    if (!uniqueIpAddresses.has(ipAddress) && uniqueIpAddresses.size >= 2) {
      return {
        isSuspicious: true,
        activityType: 'UNUSUAL_LOCATION',
        details: {
          currentIp: ipAddress,
          currentLocation: location,
          previousIps: Array.from(uniqueIpAddresses),
          previousLoginCount: recentLogins.length,
        },
      };
    }

    return { isSuspicious: false, activityType: null };
  }
}
