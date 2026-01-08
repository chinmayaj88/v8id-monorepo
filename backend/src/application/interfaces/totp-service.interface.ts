/**
 * TOTP Service Interface
 * 
 * Defines the contract for TOTP (Time-based One-Time Password) operations.
 */

export interface TotpSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface ITotpService {
  /**
   * Generate a new TOTP secret
   */
  generateSecret(): string;

  /**
   * Generate TOTP setup (secret + QR code + backup codes)
   */
  generateTotpSetup(
    email: string,
    secret?: string
  ): Promise<TotpSetupResult>;

  /**
   * Verify TOTP code
   */
  verifyTotp(token: string, secret: string): boolean;

  /**
   * Generate backup codes
   */
  generateBackupCodes(count?: number): string[];

  /**
   * Encrypt TOTP secret (AES-256-GCM)
   */
  encryptSecret(secret: string, encryptionKey: string): string;

  /**
   * Decrypt TOTP secret
   */
  decryptSecret(encryptedData: string, encryptionKey: string): string;
}
