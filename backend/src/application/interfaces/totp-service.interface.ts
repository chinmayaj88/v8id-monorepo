export interface TotpSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface ITotpService {
  generateSecret(): string;

  generateTotpSetup(
    email: string,
    secret?: string
  ): Promise<TotpSetupResult>;

  verifyTotp(token: string, secret: string): boolean;

  generateBackupCodes(count?: number): string[];

  encryptSecret(secret: string, encryptionKey: string): string;

  decryptSecret(encryptedData: string, encryptionKey: string): string;
}
