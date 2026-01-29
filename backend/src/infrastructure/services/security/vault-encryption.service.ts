import crypto from 'crypto';

/**
 * Vault Encryption Service
 *
 * Implements AES-256-GCM encryption for enterprise-grade secret storage.
 * Uses Initialization Vectors (IV) and Authentication Tags to ensure data integrity.
 */
export class VaultEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // 96 bits for GCM

  /**
   * Encrypts plain text using the provided master key.
   * In production, the master key should come from OCI Vault or an Env var.
   */
  encrypt(text: string, masterKey: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(this.ivLength);
    const key = crypto.scryptSync(masterKey, 'v8id-vault-salt', this.keyLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag,
    };
  }

  /**
   * Decrypts hex data using the provided master key, iv, and auth tag.
   */
  decrypt(encryptedData: string, masterKey: string, ivHex: string, authTagHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(masterKey, 'v8id-vault-salt', this.keyLength);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
