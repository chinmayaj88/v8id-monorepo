export interface ITotpBackupCodeRepository {

  createCodes(userId: string, hashedCodes: string[]): Promise<void>;

  verifyAndUseCode(userId: string, code: string): Promise<boolean>;

  deleteAllForUser(userId: string): Promise<void>;
}

