/**
 * TOTP Service
 * 
 * Handles TOTP (Time-based One-Time Password) generation and verification.
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const TOTP_ISSUER = process.env.TOTP_ISSUER || 'v8id-cloud';

export interface TotpSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class TotpService {
  /**
   * Generate a new TOTP secret
   */
  static generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate TOTP setup (secret + QR code + backup codes)
   */
  static async generateTotpSetup(
    email: string,
    secret?: string
  ): Promise<TotpSetupResult> {
    const totpSecret = secret || this.generateSecret();
    const serviceName = TOTP_ISSUER;

    // Generate QR code URL
    const otpAuthUrl = authenticator.keyuri(email, serviceName, totpSecret);

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate backup codes (10 codes, each 12 characters)
    const backupCodes = this.generateBackupCodes(10);

    return {
      secret: totpSecret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code
   */
  static verifyTotp(token: string, secret: string): boolean {
    try {
      return authenticator.check(token, secret);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 12-character alphanumeric code
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();
      // Format as XXXX-XXXX-XXXX
      const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
      codes.push(formatted);
    }
    return codes;
  }

  /**
   * Derive a 32-byte key from any string using SHA-256
   */
  private static deriveKey(keyString: string): Buffer {
    return crypto.createHash('sha256').update(keyString).digest();
  }

  /**
   * Encrypt TOTP secret (AES-256-GCM)
   */
  static encryptSecret(secret: string, encryptionKey: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const key = this.deriveKey(encryptionKey);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV, authTag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt TOTP secret
   */
  static decryptSecret(encryptedData: string, encryptionKey: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = this.deriveKey(encryptionKey);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

