import { ITotpBackupCodeRepository } from '../interfaces/totp-backup-code-repository.interface.js';

export interface GetBackupCodesResult {
  totalCodes: number;
  unusedCodes: number;
  usedCodes: number;
}

export class GetBackupCodesUseCase {
  constructor(private totpBackupCodeRepository: ITotpBackupCodeRepository) {}

  async execute(userId: string): Promise<GetBackupCodesResult> {
    const stats = await this.totpBackupCodeRepository.getBackupCodeStats(userId);

    return {
      totalCodes: stats.total,
      unusedCodes: stats.unused,
      usedCodes: stats.used,
    };
  }
}
