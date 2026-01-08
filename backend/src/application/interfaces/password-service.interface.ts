/**
 * Password Service Interface
 * 
 * Defines the contract for password hashing and verification operations.
 */

export interface IPasswordService {
  /**
   * Hash a password
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Verify a password against a hash
   */
  verifyPassword(password: string, hash: string): Promise<boolean>;
}
