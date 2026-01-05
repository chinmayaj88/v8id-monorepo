/**
 * TOTP Backup Code Repository Interface
 * 
 * Defines the contract for TOTP backup code data access operations.
 */

export interface ITotpBackupCodeRepository {
  /**
   * Create backup codes for a user
   */
  createCodes(userId: string, hashedCodes: string[]): Promise<void>;

  /**
   * Verify and mark a backup code as used
   */
  verifyAndUseCode(userId: string, code: string): Promise<boolean>;

  /**
   * Delete all backup codes for a user
   */
  deleteAllForUser(userId: string): Promise<void>;
}

