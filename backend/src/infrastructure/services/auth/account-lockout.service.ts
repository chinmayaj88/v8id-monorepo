/**
 * Account Lockout Service
 *
 * Tracks failed login attempts and locks accounts after too many failures.
 * Uses audit logs to track attempts (no schema changes needed).
 */

import {
  IAuditLogRepository,
  IAccountLockoutService,
  AuditEventType,
} from '../../../application/interfaces/index.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export class AccountLockoutService implements IAccountLockoutService {
  constructor(private auditLogRepository: IAuditLogRepository) {}

  /**
   * Check if account is locked due to too many failed login attempts
   */
  async isAccountLocked(userId: string): Promise<{ locked: boolean; unlockAt?: Date }> {
    // Get failed login attempts in the last 15 minutes
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);

    const failedAttempts = await this.auditLogRepository.findByUserIdAndEventType(
      userId,
      AuditEventType.LOGIN_FAILED,
      windowStart
    );

    if (failedAttempts.length >= MAX_FAILED_ATTEMPTS) {
      // Find the oldest failed attempt in the window
      const oldestAttempt = failedAttempts.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];

      if (!oldestAttempt) {
        return { locked: false };
      }

      // Calculate when the lockout expires (15 minutes from oldest attempt)
      const unlockAt = new Date(oldestAttempt.createdAt.getTime() + LOCKOUT_WINDOW_MS);

      // Check if lockout has expired
      if (unlockAt > new Date()) {
        return { locked: true, unlockAt };
      }
    }

    return { locked: false };
  }

  /**
   * Get number of failed attempts in the lockout window
   */
  async getFailedAttemptCount(userId: string): Promise<number> {
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);

    const failedAttempts = await this.auditLogRepository.findByUserIdAndEventType(
      userId,
      AuditEventType.LOGIN_FAILED,
      windowStart
    );

    return failedAttempts.length;
  }

  /**
   * Reset failed attempts count (called on successful login)
   * Note: This doesn't actually delete audit logs, just provides a way to check
   */
  async resetFailedAttempts(_userId: string): Promise<void> {
    // Audit logs are kept for security, but successful login means
    // we can check the lockout status again on next attempt
    // This method is here for future use if we want to track attempts differently
  }
}

