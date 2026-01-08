/**
 * Account Lockout Service Interface
 * 
 * Defines the contract for account lockout operations.
 */

export interface IAccountLockoutService {
  /**
   * Check if account is locked due to too many failed login attempts
   */
  isAccountLocked(userId: string): Promise<{ locked: boolean; unlockAt?: Date }>;

  /**
   * Get number of failed attempts in the lockout window
   */
  getFailedAttemptCount(userId: string): Promise<number>;

  /**
   * Reset failed attempts count (called on successful login)
   */
  resetFailedAttempts(userId: string): Promise<void>;
}
